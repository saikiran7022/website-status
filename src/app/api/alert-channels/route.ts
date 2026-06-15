import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

const TYPES = ["email", "webhook"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const channels = await prisma.alertChannel.findMany({
    where: { orgId: auth.ctx.orgId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;

  const { name, type, target } = await req.json().catch(() => ({}));
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "type must be 'email' or 'webhook'" }, { status: 400 });
  }
  if (!target?.trim()) {
    return NextResponse.json({ error: "target is required" }, { status: 400 });
  }
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (type === "webhook" && !/^https?:\/\//i.test(target)) {
    return NextResponse.json({ error: "Webhook target must be a URL" }, { status: 400 });
  }

  const channel = await prisma.alertChannel.create({
    data: {
      orgId: auth.ctx.orgId,
      name: name?.trim() || (type === "email" ? target : "Webhook"),
      type,
      target: target.trim(),
    },
  });
  return NextResponse.json(channel, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;

  const { id, enabled } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const channel = await prisma.alertChannel.findUnique({ where: { id } });
  if (!channel || channel.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.alertChannel.update({ where: { id }, data: { enabled: Boolean(enabled) } });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const channel = await prisma.alertChannel.findUnique({ where: { id } });
  if (!channel || channel.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.alertChannel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
