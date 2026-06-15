import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { generateApiKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const keys = await prisma.apiKey.findMany({
    where: { orgId: auth.ctx.orgId },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin"] });
  if ("error" in auth) return auth.error;

  const { name } = await req.json().catch(() => ({}));
  const { key, prefix, hash } = generateApiKey();

  const record = await prisma.apiKey.create({
    data: {
      orgId: auth.ctx.orgId,
      name: name?.trim() || "API key",
      prefix,
      hash,
      createdById: auth.ctx.userId,
    },
  });

  // The plaintext key is returned exactly once and never stored.
  return NextResponse.json(
    { id: record.id, name: record.name, prefix: record.prefix, key },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin"] });
  if ("error" in auth) return auth.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key || key.orgId !== auth.ctx.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
