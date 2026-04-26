import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export interface CheckResult {
  monitorId: string;
  timestamp: Date;
  responseTime: number | null;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  attempt: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms

async function performCheck(
  monitor: typeof schema.monitors.$inferSelect
): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    if (monitor.type === "http" || monitor.type === "https") {
      return await httpCheck(monitor, startTime);
    } else if (monitor.type === "tcp") {
      return await tcpCheck(monitor, startTime);
    } else if (monitor.type === "ping") {
      return await pingCheck(monitor, startTime);
    } else if (monitor.type === "dns") {
      return await dnsCheck(monitor, startTime);
    }

    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime: null,
      statusCode: null,
      success: false,
      errorMessage: `Unknown monitor type: ${monitor.type}`,
      attempt: 1,
    };
  } catch (error) {
    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime: null,
      statusCode: null,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      attempt: 1,
    };
  }
}

async function httpCheck(
  monitor: typeof schema.monitors.$inferSelect,
  startTime: number
): Promise<CheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), monitor.timeout || 30000);

  try {
    const headers = monitor.headers ? JSON.parse(monitor.headers as string) : {};
    const response = await fetch(monitor.url, {
      method: monitor.method || "GET",
      headers: {
        "User-Agent": "WebsiteStatus/1.0 (Uptime Monitor)",
        ...headers,
      },
      body: monitor.body || undefined,
      signal: controller.signal,
      redirect: "manual",
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const expectedStatus = monitor.expectedStatusCode || 200;

    let success = statusCode === expectedStatus;

    // Check keyword if configured
    if (monitor.keyword && success) {
      const bodyText = await response.text();
      success = bodyText.includes(monitor.keyword);
      if (!success) {
        return {
          monitorId: monitor.id,
          timestamp: new Date(),
          responseTime,
          statusCode,
          success: false,
          errorMessage: `Keyword "${monitor.keyword}" not found in response`,
          attempt: 1,
        };
      }
    }

    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime,
      statusCode,
      success,
      errorMessage: success ? null : `Expected status ${expectedStatus}, got ${statusCode}`,
      attempt: 1,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function tcpCheck(
  monitor: typeof schema.monitors.$inferSelect,
  startTime: number
): Promise<CheckResult> {
  const { hostname, port } = parseUrl(monitor.url);

  return new Promise((resolve) => {
    const timeout = monitor.timeout || 30000;
    const timer = setTimeout(() => {
      resolve({
        monitorId: monitor.id,
        timestamp: new Date(),
        responseTime: null,
        statusCode: null,
        success: false,
        errorMessage: "Connection timed out",
        attempt: 1,
      });
    }, timeout);

    const socket = require("net").createConnection(
      { host: hostname, port: parseInt(port), timeout },
      () => {
        const responseTime = Date.now() - startTime;
        clearTimeout(timer);
        socket.destroy();
        resolve({
          monitorId: monitor.id,
          timestamp: new Date(),
          responseTime,
          statusCode: null,
          success: true,
          errorMessage: null,
          attempt: 1,
        });
      }
    );

    socket.on("error", (err: Error) => {
      clearTimeout(timer);
      socket.destroy();
      resolve({
        monitorId: monitor.id,
        timestamp: new Date(),
        responseTime: null,
        statusCode: null,
        success: false,
        errorMessage: err.message,
        attempt: 1,
      });
    });
  });
}

async function pingCheck(
  monitor: typeof schema.monitors.$inferSelect,
  startTime: number
): Promise<CheckResult> {
  const hostname = new URL(monitor.url.startsWith("http") ? monitor.url : `https://${monitor.url}`).hostname;

  try {
    const { execSync } = require("child_process");
    const start = Date.now();
    execSync(`ping -c 1 -W 5 ${hostname}`, { stdio: "pipe" });
    const responseTime = Date.now() - start;

    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime,
      statusCode: null,
      success: true,
      errorMessage: null,
      attempt: 1,
    };
  } catch (error) {
    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime: null,
      statusCode: null,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Ping failed",
      attempt: 1,
    };
  }
}

async function dnsCheck(
  monitor: typeof schema.monitors.$inferSelect,
  startTime: number
): Promise<CheckResult> {
  const hostname = new URL(monitor.url.startsWith("http") ? monitor.url : `https://${monitor.url}`).hostname;

  try {
    const { promises: dns } = require("dns");
    const records = await dns.resolve(hostname);
    const responseTime = Date.now() - startTime;

    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime,
      statusCode: null,
      success: true,
      errorMessage: null,
      attempt: 1,
    };
  } catch (error) {
    return {
      monitorId: monitor.id,
      timestamp: new Date(),
      responseTime: null,
      statusCode: null,
      success: false,
      errorMessage: error instanceof Error ? error.message : "DNS resolution failed",
      attempt: 1,
    };
  }
}

export async function checkMonitorWithRetry(
  monitor: typeof schema.monitors.$inferSelect
): Promise<CheckResult> {
  let lastResult: CheckResult | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    lastResult = await performCheck(monitor);

    if (lastResult.success) {
      // Save the successful check
      await db.insert(schema.checks).values({
        monitorId: monitor.id,
        timestamp: lastResult.timestamp,
        responseTime: lastResult.responseTime,
        statusCode: lastResult.statusCode,
        success: lastResult.success,
        errorMessage: lastResult.errorMessage,
        attempt,
      });
      return lastResult;
    }

    // Wait before retry (except on last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }

  // All retries failed - save the final result
  if (lastResult) {
    await db.insert(schema.checks).values({
      monitorId: monitor.id,
      timestamp: lastResult.timestamp,
      responseTime: lastResult.responseTime,
      statusCode: lastResult.statusCode,
      success: false,
      errorMessage: lastResult.errorMessage,
      attempt: MAX_RETRIES,
    });
    return lastResult;
  }

  return {
    monitorId: monitor.id,
    timestamp: new Date(),
    responseTime: null,
    statusCode: null,
    success: false,
    errorMessage: "Check failed",
    attempt: MAX_RETRIES,
  };
}

export async function runAllChecks() {
  const monitors = await db.query.monitors.findMany({
    where: eq(schema.monitors.enabled, true),
  });

  const now = new Date();
  const results: { monitor: typeof schema.monitors.$inferSelect; result: CheckResult }[] = [];

  for (const monitor of monitors) {
    // Check if it's time to run based on interval
    const lastCheck = await db.query.checks.findFirst({
      where: eq(schema.checks.monitorId, monitor.id),
      orderBy: [desc(schema.checks.timestamp)],
    });

    const shouldRun = !lastCheck || now.getTime() - lastCheck.timestamp.getTime() >= (monitor.interval ?? 300) * 1000;

    if (shouldRun) {
      const result = await checkMonitorWithRetry(monitor);
      results.push({ monitor, result });
    }
  }

  return results;
}

function parseUrl(url: string): { hostname: string; port: string } {
  try {
    const parsed = new URL(url);
    return { hostname: parsed.hostname, port: parsed.port };
  } catch {
    // Try as host:port
    const parts = url.split(":");
    return { hostname: parts[0], port: parts[1] || "80" };
  }
}

export async function testMonitor(
  monitor: typeof schema.monitors.$inferSelect
): Promise<CheckResult> {
  return checkMonitorWithRetry(monitor);
}
