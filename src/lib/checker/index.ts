import { prisma } from "@/lib/db";
import { dispatchIncidentAlert } from "@/lib/notifications";

export type CheckStatus = "up" | "degraded" | "down";

export interface CheckOutcome {
  status: CheckStatus;
  statusCode: number | null;
  responseTime: number;
  error: string | null;
}

export interface CheckableMonitor {
  id: string;
  url: string;
  method?: string | null;
  timeout?: number | null;
  expectedStatus?: number | null;
  keyword?: string | null;
  headers?: string | null;
  body?: string | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

function normalizeUrl(input: string): string {
  const url = input.trim();
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

function parseHeaders(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    /* ignore malformed header JSON */
  }
  return {};
}

/** Perform a single HTTP check. Does not touch the database. */
export async function performCheck(monitor: CheckableMonitor): Promise<CheckOutcome> {
  const start = Date.now();
  const method = (monitor.method || "GET").toUpperCase();
  const timeout = monitor.timeout ?? 30000;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(normalizeUrl(monitor.url), {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "WebsiteStatusBot/1.0", ...parseHeaders(monitor.headers) },
      body: ["GET", "HEAD"].includes(method) ? undefined : monitor.body || undefined,
    });

    // Keyword matching requires the response body.
    let bodyText: string | null = null;
    if (monitor.keyword) {
      try {
        bodyText = await res.text();
      } catch {
        bodyText = null;
      }
    }
    clearTimeout(timer);
    const responseTime = Date.now() - start;

    if (monitor.keyword && (bodyText === null || !bodyText.includes(monitor.keyword))) {
      return { status: "down", statusCode: res.status, responseTime, error: `Keyword "${monitor.keyword}" not found` };
    }

    if (monitor.expectedStatus != null) {
      return res.status === monitor.expectedStatus
        ? { status: "up", statusCode: res.status, responseTime, error: null }
        : { status: "down", statusCode: res.status, responseTime, error: `Expected ${monitor.expectedStatus}, got ${res.status}` };
    }

    if (res.status >= 200 && res.status < 300) {
      return { status: "up", statusCode: res.status, responseTime, error: null };
    }
    if (res.status >= 300 && res.status < 400) {
      return { status: "degraded", statusCode: res.status, responseTime, error: null };
    }
    return { status: "down", statusCode: res.status, responseTime, error: `HTTP ${res.status}` };
  } catch (err: any) {
    const responseTime = Date.now() - start;
    const aborted = err?.name === "AbortError";
    return {
      status: "down",
      statusCode: null,
      responseTime,
      error: aborted ? `Timed out after ${timeout}ms` : err?.message || "Connection failed",
    };
  }
}

/**
 * Run a check, retrying on failure to avoid flapping, then persist the result
 * and open/resolve incidents (with alerts) as needed.
 */
export async function checkMonitor(monitor: {
  id: string;
  name: string;
  url: string;
  orgId: string;
  method?: string | null;
  timeout?: number | null;
  expectedStatus?: number | null;
  keyword?: string | null;
  headers?: string | null;
  body?: string | null;
}): Promise<CheckOutcome> {
  let outcome = await performCheck(monitor);
  for (let attempt = 1; attempt < MAX_RETRIES && outcome.status === "down"; attempt++) {
    await delay(RETRY_DELAY * attempt);
    outcome = await performCheck(monitor);
  }

  await prisma.checkResult.create({
    data: {
      monitorId: monitor.id,
      status: outcome.status,
      statusCode: outcome.statusCode,
      responseTime: outcome.responseTime,
      error: outcome.error,
    },
  });

  await reconcileIncident(monitor, outcome);
  return outcome;
}

/** Open an incident on a new outage, or resolve the open auto-incident on recovery. */
async function reconcileIncident(
  monitor: { id: string; name: string; orgId: string },
  outcome: CheckOutcome
): Promise<void> {
  const openIncident = await prisma.incident.findFirst({
    where: { monitorId: monitor.id, status: "open", auto: true },
    orderBy: { createdAt: "desc" },
  });

  if (outcome.status === "down") {
    if (openIncident) return; // already tracking this outage
    const incident = await prisma.incident.create({
      data: {
        monitorId: monitor.id,
        title: `${monitor.name} is down`,
        description: outcome.error,
        severity: "critical",
        status: "open",
        auto: true,
        updates: { create: { message: outcome.error || "Monitor is down", status: "open" } },
      },
    });
    await dispatchIncidentAlert({
      orgId: monitor.orgId,
      event: "incident_open",
      monitor: { id: monitor.id, name: monitor.name, url: (monitor as any).url ?? "" },
      incident: { id: incident.id, title: incident.title, severity: incident.severity },
      error: outcome.error,
    });
    return;
  }

  // Recovery: monitor is up/degraded again.
  if (openIncident) {
    await prisma.incident.update({
      where: { id: openIncident.id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        updates: { create: { message: "Monitor recovered", status: "resolved" } },
      },
    });
    await dispatchIncidentAlert({
      orgId: monitor.orgId,
      event: "incident_resolved",
      monitor: { id: monitor.id, name: monitor.name, url: (monitor as any).url ?? "" },
      incident: { id: openIncident.id, title: openIncident.title, severity: openIncident.severity },
    });
  }
}

/** Check every active monitor regardless of schedule (manual full sweep). */
export async function runAllChecks() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  const results: { monitor: { id: string; name: string; url: string }; result: CheckOutcome }[] = [];
  for (const m of monitors) {
    const result = await checkMonitor(m);
    results.push({ monitor: { id: m.id, name: m.name, url: m.url }, result });
  }
  return results;
}

/** Check only monitors whose configured interval has elapsed since their last check. */
export async function runDueChecks() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  const now = Date.now();
  const due: typeof monitors = [];
  for (const m of monitors) {
    const last = await prisma.checkResult.findFirst({
      where: { monitorId: m.id },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    });
    if (!last || now - last.timestamp.getTime() >= m.interval * 60 * 1000) {
      due.push(m);
    }
  }
  const results: { monitor: { id: string; name: string; url: string }; result: CheckOutcome }[] = [];
  for (const m of due) {
    const result = await checkMonitor(m);
    results.push({ monitor: { id: m.id, name: m.name, url: m.url }, result });
  }
  return results;
}

/** Run a check immediately without persisting anything (used by the "Test" button). */
export async function testMonitor(monitor: CheckableMonitor): Promise<CheckOutcome> {
  return performCheck(monitor);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
