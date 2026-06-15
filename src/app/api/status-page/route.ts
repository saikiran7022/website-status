import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Get (creating a default if missing) the org's status page. */
async function getOrCreate(orgId: string) {
  let page = await prisma.statusPage.findUnique({ where: { orgId } });
  if (!page) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    page = await prisma.statusPage.create({
      data: { orgId, slug: org?.slug || orgId, title: `${org?.name || "Organization"} Status` },
    });
  }
  return page;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;
  return NextResponse.json(await getOrCreate(auth.ctx.orgId));
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, { roles: ["admin", "editor"] });
  if ("error" in auth) return auth.error;

  const page = await getOrCreate(auth.ctx.orgId);
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim() || page.title;
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl?.trim() || null;
  if (body.accentColor !== undefined) data.accentColor = body.accentColor || "#3b82f6";
  if (body.isPublic !== undefined) data.isPublic = Boolean(body.isPublic);

  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (slug && slug !== page.slug) {
      const clash = await prisma.statusPage.findUnique({ where: { slug } });
      if (clash && clash.id !== page.id) {
        return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
      }
      data.slug = slug;
    }
  }

  try {
    const updated = await prisma.statusPage.update({ where: { id: page.id }, data });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update status page" }, { status: 500 });
  }
}
