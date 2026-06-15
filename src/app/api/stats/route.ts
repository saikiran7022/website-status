import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

const calcUptime = (checks: { status: string }[]) => {
  if (checks.length === 0) return 100;
  const up = checks.filter((c) => c.status === "up" || c.status === "degraded").length;
  return (up / checks.length) * 100;
};

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const monitors = await prisma.monitor.findMany({ where: { orgId: auth.ctx.orgId } });
  const now = Date.now();
  const since = {
    "24h": new Date(now - 24 * 60 * 60 * 1000),
    "7d": new Date(now - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now - 30 * 24 * 60 * 60 * 1000),
  };

  const stats: Record<string, unknown> = {};
  for (const m of monitors) {
    const checks30 = await prisma.checkResult.findMany({
      where: { monitorId: m.id, timestamp: { gte: since["30d"] } },
      orderBy: { timestamp: "desc" },
    });
    const checks24 = checks30.filter((c) => c.timestamp >= since["24h"]);
    const checks7 = checks30.filter((c) => c.timestamp >= since["7d"]);
    const last = checks30[0];
    const avgResp =
      checks24.length > 0 ? Math.round(checks24.reduce((s, c) => s + c.responseTime, 0) / checks24.length) : 0;

    stats[m.id] = {
      monitorId: m.id,
      uptime24h: calcUptime(checks24),
      uptime7d: calcUptime(checks7),
      uptime30d: calcUptime(checks30),
      avgResponseTime: avgResp,
      lastStatus: last?.status || "unknown",
      lastChecked: last?.timestamp || null,
    };
  }

  return NextResponse.json(stats);
}
