import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor || monitor.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10), 500);
  const checks = await prisma.checkResult.findMany({
    where: { monitorId: id },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
  return NextResponse.json(checks);
}
