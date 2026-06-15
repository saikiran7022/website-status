import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const monitorId = req.nextUrl.searchParams.get("monitorId");
  if (!monitorId) return NextResponse.json({ error: "monitorId is required" }, { status: 400 });

  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor || monitor.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 90);
  since.setHours(0, 0, 0, 0);
  const checks = await prisma.checkResult.findMany({
    where: { monitorId, timestamp: { gte: since } },
    select: { status: true, timestamp: true },
  });

  const days: { date: string; status: string }[] = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const dayChecks = checks.filter((c) => c.timestamp >= date && c.timestamp < next);
    if (dayChecks.length === 0) {
      days.push({ date: date.toISOString().split("T")[0], status: "none" });
    } else {
      const up = dayChecks.filter((c) => c.status === "up" || c.status === "degraded").length;
      const ratio = up / dayChecks.length;
      days.push({
        date: date.toISOString().split("T")[0],
        status: ratio >= 0.95 ? "up" : ratio >= 0.5 ? "partial" : "down",
      });
    }
  }

  return NextResponse.json(days);
}
