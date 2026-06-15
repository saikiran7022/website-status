import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

const calcUptime = (checks: { status: string }[]) => {
  if (checks.length === 0) return 100;
  const up = checks.filter((c) => c.status === "up" || c.status === "degraded").length;
  return Math.round((up / checks.length) * 10000) / 100;
};

// GET /api/v1/uptime — uptime percentages per monitor over 24h/7d/30d
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const now = Date.now();
  const since30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const since24 = new Date(now - 24 * 60 * 60 * 1000);
  const since7 = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const monitors = await prisma.monitor.findMany({
    where: { orgId: auth.ctx.orgId },
    include: { checkResults: { where: { timestamp: { gte: since30 } }, select: { status: true, timestamp: true } } },
  });

  return NextResponse.json({
    data: monitors.map((m) => ({
      id: m.id,
      name: m.name,
      uptime24h: calcUptime(m.checkResults.filter((c) => c.timestamp >= since24)),
      uptime7d: calcUptime(m.checkResults.filter((c) => c.timestamp >= since7)),
      uptime30d: calcUptime(m.checkResults),
    })),
  });
}
