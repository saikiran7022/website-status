import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { hashPassword, randomToken } from "@/lib/auth";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "editor", "viewer"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({
    where: { orgId: auth.ctx.orgId },
    select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin"] });
  if ("error" in auth) return auth.error;
  const { orgId } = auth.ctx;

  const { email, name, role } = await req.json().catch(() => ({}));
  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (role && !ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const org = await prisma.org.findUnique({ where: { id: orgId } });
  const plan = getPlan(org?.plan);
  const memberCount = await prisma.user.count({ where: { orgId } });
  if (plan.maxMembers != null && memberCount >= plan.maxMembers) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan allows up to ${plan.maxMembers} members.` },
      { status: 403 }
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  // Create the member with a temporary password the admin can share; the member
  // can change it via the password-reset flow.
  const tempPassword = randomToken(8);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: String(name).trim(),
      role: role || "viewer",
      orgId,
      password: await hashPassword(tempPassword),
    },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role, tempPassword },
    { status: 201 }
  );
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin"] });
  if ("error" in auth) return auth.error;

  const { id, role } = await req.json().catch(() => ({}));
  if (!id || !ROLES.includes(role)) {
    return NextResponse.json({ error: "id and a valid role are required" }, { status: 400 });
  }

  const member = await prisma.user.findUnique({ where: { id } });
  if (!member || member.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({ where: { id }, data: { role } });
  return NextResponse.json({ id: updated.id, role: updated.role });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin"] });
  if ("error" in auth) return auth.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (id === auth.ctx.userId) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  const member = await prisma.user.findUnique({ where: { id } });
  if (!member || member.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
