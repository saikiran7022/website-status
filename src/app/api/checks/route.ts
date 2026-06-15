import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const monitorId = req.nextUrl.searchParams.get("monitorId");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10), 500);

  const checks = await prisma.checkResult.findMany({
    where: {
      monitor: { orgId: auth.ctx.orgId },
      ...(monitorId ? { monitorId } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    include: { monitor: { select: { name: true } } },
  });
  return NextResponse.json(checks);
}
