import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

// Rename the organization (admins only).
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin"] });
  if ("error" in auth) return auth.error;

  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const org = await prisma.org.update({
    where: { id: auth.ctx.orgId },
    data: { name: String(name).trim() },
  });
  return NextResponse.json({ id: org.id, name: org.name });
}
