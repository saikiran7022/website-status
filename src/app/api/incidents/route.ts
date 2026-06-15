import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const incidents = await prisma.incident.findMany({
    where: { monitor: { orgId: auth.ctx.orgId } },
    include: { monitor: { select: { name: true, url: true } }, updates: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(incidents);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;

  const { monitorId, title, description, severity } = await req.json().catch(() => ({}));
  if (!monitorId || !title) {
    return NextResponse.json({ error: "monitorId and title are required" }, { status: 400 });
  }

  // Ensure the monitor belongs to the caller's org.
  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });
  if (!monitor || monitor.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  const incident = await prisma.incident.create({
    data: {
      monitorId,
      title: String(title).trim(),
      description: description?.trim() || null,
      severity: severity || "major",
      status: "open",
      auto: false,
      updates: { create: { message: description?.trim() || "Incident opened", status: "open" } },
    },
  });
  return NextResponse.json(incident, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;

  const { id, status, message } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await prisma.incident.findUnique({ where: { id }, include: { monitor: true } });
  if (!existing || existing.monitor.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const incident = await prisma.incident.update({
    where: { id },
    data: {
      ...(status ? { status, resolvedAt: status === "resolved" ? new Date() : null } : {}),
      updates: { create: { message: message?.trim() || `Status changed to ${status}`, status: status || existing.status } },
    },
    include: { updates: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(incident);
}
