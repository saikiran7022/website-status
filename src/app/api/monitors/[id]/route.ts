import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

async function loadOwned(orgId: string, id: string) {
  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor || monitor.orgId !== orgId) return null;
  return monitor;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const monitor = await loadOwned(auth.ctx.orgId, id);
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(monitor);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const monitor = await loadOwned(auth.ctx.orgId, id);
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.url !== undefined) {
    const url = String(body.url).trim();
    data.url = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }
  if (body.method !== undefined) data.method = String(body.method).toUpperCase();
  if (body.interval !== undefined) data.interval = Number(body.interval);
  if (body.timeout !== undefined) data.timeout = Number(body.timeout);
  if (body.expectedStatus !== undefined) data.expectedStatus = body.expectedStatus ? Number(body.expectedStatus) : null;
  if (body.keyword !== undefined) data.keyword = body.keyword?.trim() || null;
  if (body.headers !== undefined) data.headers = body.headers?.trim() || null;
  if (body.body !== undefined) data.body = body.body?.trim() || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  try {
    const updated = await prisma.monitor.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "A monitor for this URL already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const monitor = await loadOwned(auth.ctx.orgId, id);
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.monitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
