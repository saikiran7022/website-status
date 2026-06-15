import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

// GET /api/v1/monitors/:id/status — current status + recent checks
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const monitor = await prisma.monitor.findUnique({
    where: { id },
    include: { checkResults: { orderBy: { timestamp: "desc" }, take: 20 } },
  });
  if (!monitor || monitor.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const last = monitor.checkResults[0];
  return NextResponse.json({
    data: {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      status: last?.status ?? "unknown",
      statusCode: last?.statusCode ?? null,
      responseTime: last?.responseTime ?? null,
      lastChecked: last?.timestamp ?? null,
      recentChecks: monitor.checkResults.map((c) => ({
        status: c.status,
        statusCode: c.statusCode,
        responseTime: c.responseTime,
        timestamp: c.timestamp,
        error: c.error,
      })),
    },
  });
}
