import { NextRequest, NextResponse } from "next/server";
import { testMonitor } from "@/lib/checker";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor || monitor.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await testMonitor(monitor);
  return NextResponse.json(result);
}
