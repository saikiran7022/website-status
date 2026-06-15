import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

// GET /api/v1/monitors — list monitors (API key or session)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const monitors = await prisma.monitor.findMany({
    where: { orgId: auth.ctx.orgId },
    include: { checkResults: { orderBy: { timestamp: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: monitors.map((m) => ({
      id: m.id,
      name: m.name,
      url: m.url,
      method: m.method,
      interval: m.interval,
      active: m.isActive,
      status: m.checkResults[0]?.status ?? "unknown",
      lastChecked: m.checkResults[0]?.timestamp ?? null,
    })),
  });
}

// POST /api/v1/monitors — create a monitor
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;
  const { orgId } = auth.ctx;

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const org = await prisma.org.findUnique({ where: { id: orgId } });
  const plan = getPlan(org?.plan);
  const count = await prisma.monitor.count({ where: { orgId } });
  if (plan.maxMonitors != null && count >= plan.maxMonitors) {
    return NextResponse.json({ error: `Monitor limit reached for ${plan.name} plan` }, { status: 403 });
  }

  const url = String(body.url).trim();
  try {
    const monitor = await prisma.monitor.create({
      data: {
        orgId,
        name: String(body.name).trim(),
        url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
        method: body.method ? String(body.method).toUpperCase() : "GET",
        interval: Math.max(Number(body.interval) || 5, plan.minInterval),
      },
    });
    return NextResponse.json({ data: monitor }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A monitor for this URL already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
}
