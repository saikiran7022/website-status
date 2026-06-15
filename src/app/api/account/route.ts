import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Update the signed-in user's profile (name) and optionally their password.
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;
  if (!auth.ctx.userId) return NextResponse.json({ error: "Not a user session" }, { status: 400 });

  const { name, currentPassword, newPassword } = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (name !== undefined) data.name = String(name).trim();

  if (newPassword) {
    if (String(newPassword).length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: auth.ctx.userId } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Only require the current password when the account already has one.
    if (user.password && !(await verifyPassword(currentPassword || "", user.password))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    data.password = await hashPassword(newPassword);
  }

  const updated = await prisma.user.update({ where: { id: auth.ctx.userId }, data });
  return NextResponse.json({ id: updated.id, name: updated.name });
}
