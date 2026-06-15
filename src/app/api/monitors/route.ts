import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const monitors = await prisma.monitor.findMany({
    where: { orgId: auth.ctx.orgId },
    include: {
      _count: { select: { checkResults: true, incidents: true } },
      checkResults: { orderBy: { timestamp: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(monitors);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;
  const { orgId } = auth.ctx;

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.url) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }

  const org = await prisma.org.findUnique({ where: { id: orgId } });
  const plan = getPlan(org?.plan);

  const count = await prisma.monitor.count({ where: { orgId } });
  if (plan.maxMonitors != null && count >= plan.maxMonitors) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan allows up to ${plan.maxMonitors} monitors. Upgrade to add more.` },
      { status: 403 }
    );
  }

  let interval = Number(body.interval) || 5;
  if (interval < plan.minInterval) interval = plan.minInterval;

  const url = String(body.url).trim();
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  try {
    const monitor = await prisma.monitor.create({
      data: {
        orgId,
        name: String(body.name).trim(),
        url: normalizedUrl,
        method: typeof body.method === "string" ? body.method.toUpperCase() : "GET",
        interval,
        timeout: Number(body.timeout) || 30000,
        expectedStatus: body.expectedStatus ? Number(body.expectedStatus) : null,
        keyword: body.keyword?.trim() || null,
        headers: body.headers?.trim() || null,
        body: body.body?.trim() || null,
        isActive: body.enabled ?? body.isActive ?? true,
      },
    });
    return NextResponse.json(monitor, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A monitor for this URL already exists" }, { status: 409 });
    }
    console.error("[monitors POST]", err);
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
}
