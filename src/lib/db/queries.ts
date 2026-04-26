import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { db } from "./index";
import * as schema from "@/drizzle/schema";
import { subDays, startOfDay } from "date-fns";

// Organization queries
export async function getOrganizationBySlug(slug: string) {
  const result = await db.query.organizations.findFirst({
    where: eq(schema.organizations.slug, slug),
  });
  return result;
}

export async function getOrganizationById(id: string) {
  const result = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, id),
  });
  return result;
}

// Membership queries
export async function getUserMembership(userId: string, organizationId: string) {
  const result = await db.query.memberships.findFirst({
    where: and(
      eq(schema.memberships.userId, userId),
      eq(schema.memberships.organizationId, organizationId)
    ),
  });
  return result;
}

export async function getUserOrganizations(userId: string) {
  return db.query.memberships.findMany({
    where: eq(schema.memberships.userId, userId),
    with: {
      organization: true,
    },
  });
}

// Monitor queries
export async function getOrganizationMonitors(organizationId: string) {
  return db.query.monitors.findMany({
    where: eq(schema.monitors.organizationId, organizationId),
    orderBy: desc(schema.monitors.createdAt),
  });
}

export async function getMonitorById(id: string, organizationId: string) {
  return db.query.monitors.findFirst({
    where: and(
      eq(schema.monitors.id, id),
      eq(schema.monitors.organizationId, organizationId)
    ),
    with: {
      alerts: true,
    },
  });
}

export async function getMonitorLatestCheck(monitorId: string) {
  return db.query.checks.findFirst({
    where: eq(schema.checks.monitorId, monitorId),
    orderBy: desc(schema.checks.timestamp),
  });
}

export async function getMonitorChecks(
  monitorId: string,
  days: number = 90
) {
  const startDate = startOfDay(subDays(new Date(), days));
  return db.query.checks.findMany({
    where: and(
      eq(schema.checks.monitorId, monitorId),
      gte(schema.checks.timestamp, startDate)
    ),
    orderBy: desc(schema.checks.timestamp),
  });
}

export async function getMonitorUptimeStats(
  monitorId: string,
  days: number
): Promise<{ uptimePercent: number; totalChecks: number; failedChecks: number; avgResponseTime: number | null }> {
  const startDate = startOfDay(subDays(new Date(), days));
  const checks = await db.query.checks.findMany({
    where: and(
      eq(schema.checks.monitorId, monitorId),
      gte(schema.checks.timestamp, startDate)
    ),
  });

  if (checks.length === 0) {
    return { uptimePercent: 100, totalChecks: 0, failedChecks: 0, avgResponseTime: null };
  }

  const totalChecks = checks.length;
  const failedChecks = checks.filter((c) => !c.success).length;
  const successfulResponseTimes = checks
    .filter((c) => c.success && c.responseTime !== null)
    .map((c) => c.responseTime as number);
  const avgResponseTime = successfulResponseTimes.length > 0
    ? successfulResponseTimes.reduce((a, b) => a + b, 0) / successfulResponseTimes.length
    : null;

  return {
    uptimePercent: ((totalChecks - failedChecks) / totalChecks) * 100,
    totalChecks,
    failedChecks,
    avgResponseTime,
  };
}

export async function getMonitorResponseTimePercentiles(monitorId: string, days: number = 30) {
  const startDate = startOfDay(subDays(new Date(), days));
  const checks = await db.query.checks.findMany({
    where: and(
      eq(schema.checks.monitorId, monitorId),
      gte(schema.checks.timestamp, startDate)
    ),
    orderBy: desc(schema.checks.timestamp),
  });

  const successfulChecks = checks
    .filter((c) => c.success && c.responseTime !== null)
    .map((c) => ({ timestamp: c.timestamp, responseTime: c.responseTime as number }));

  if (successfulChecks.length === 0) return [];

  const responseTimes = successfulChecks.map((c) => c.responseTime).sort((a, b) => a - b);
  const n = responseTimes.length;

  return successfulChecks.map((check) => ({
    timestamp: check.timestamp,
    p50: responseTimes[Math.floor(n * 0.5)] || 0,
    p95: responseTimes[Math.floor(n * 0.95)] || 0,
    p99: responseTimes[Math.floor(n * 0.99)] || 0,
    actual: check.responseTime,
  }));
}

// Incident queries
export async function getOrganizationIncidents(organizationId: string) {
  return db.query.incidents.findMany({
    where: eq(schema.incidents.organizationId, organizationId),
    with: {
      updates: {
        orderBy: desc(schema.incidentUpdates.createdAt),
      },
      monitor: true,
    },
    orderBy: desc(schema.incidents.startedAt),
  });
}

export async function getMonitorIncidents(monitorId: string, days: number = 30) {
  const startDate = startOfDay(subDays(new Date(), days));
  return db.query.incidents.findMany({
    where: and(
      eq(schema.incidents.monitorId, monitorId),
      gte(schema.incidents.startedAt, startDate)
    ),
    with: {
      updates: {
        orderBy: desc(schema.incidentUpdates.createdAt),
      },
    },
    orderBy: desc(schema.incidents.startedAt),
  });
}

export async function calculateMTTR(monitorId: string, days: number = 90) {
  const startDate = startOfDay(subDays(new Date(), days));
  const incidents = await db.query.incidents.findMany({
    where: and(
      eq(schema.incidents.monitorId, monitorId),
      gte(schema.incidents.startedAt, startDate),
      eq(schema.incidents.status, "resolved" as const)
    ),
  });

  if (incidents.length === 0) return null;

  const totalResolutionTime = incidents.reduce((sum, incident) => {
    if (incident.startedAt && incident.resolvedAt) {
      return sum + (incident.resolvedAt.getTime() - incident.startedAt.getTime());
    }
    return sum;
  }, 0);

  return totalResolutionTime / incidents.length; // milliseconds
}

// Alert queries
export async function getMonitorAlerts(monitorId: string) {
  return db.query.alerts.findMany({
    where: eq(schema.alerts.monitorId, monitorId),
  });
}

export async function getOrganizationAlerts(organizationId: string) {
  const monitors = await db.query.monitors.findMany({
    where: eq(schema.monitors.organizationId, organizationId),
    with: {
      alerts: {
        with: {
          history: {
            orderBy: desc(schema.alertHistory.triggeredAt),
            limit: 10,
          },
        },
      },
    },
  });
  return monitors;
}

// Status page queries
export async function getStatusPageBySlug(slug: string) {
  return db.query.statusPages.findFirst({
    where: eq(schema.statusPages.slug, slug),
    with: {
      monitors: {
        with: {
          monitor: true,
        },
      },
    },
  });
}

export async function getOrganizationStatusPages(organizationId: string) {
  return db.query.statusPages.findMany({
    where: eq(schema.statusPages.organizationId, organizationId),
    with: {
      monitors: {
        with: {
          monitor: true,
        },
      },
    },
    orderBy: desc(schema.statusPages.createdAt),
  });
}

// API Key queries
export async function getOrganizationApiKeys(organizationId: string) {
  return db.query.apiKeys.findMany({
    where: eq(schema.apiKeys.organizationId, organizationId),
    orderBy: desc(schema.apiKeys.createdAt),
  });
}

// Audit log queries
export async function getOrganizationAuditLogs(organizationId: string) {
  return db.query.auditLogs.findMany({
    where: eq(schema.auditLogs.organizationId, organizationId),
    with: {
      user: true,
    },
    orderBy: desc(schema.auditLogs.createdAt),
    limit: 100,
  });
}

// Membership management
export async function getOrganizationMembers(organizationId: string) {
  return db.query.memberships.findMany({
    where: eq(schema.memberships.organizationId, organizationId),
    with: {
      user: true,
    },
  });
}

// User queries
export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, id),
  });
}

export async function createAuditLog(data: {
  organizationId: string;
  userId: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  return db.insert(schema.auditLogs).values({
    ...data,
    details: data.details ? JSON.parse(JSON.stringify(data.details)) : null,
  });
}

// Check creation
export async function createCheck(data: {
  monitorId: string;
  responseTime: number | null;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  attempt: number;
}) {
  return db.insert(schema.checks).values(data);
}
