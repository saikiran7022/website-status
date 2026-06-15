import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

/** Find a slug that isn't taken by any Org or StatusPage, appending -2, -3, … as needed. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "org";
  let candidate = root;
  let n = 1;
  // Slugs are shared between Org.slug and StatusPage.slug, so check both.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [org, page] = await Promise.all([
      prisma.org.findUnique({ where: { slug: candidate } }),
      prisma.statusPage.findUnique({ where: { slug: candidate } }),
    ]);
    if (!org && !page) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

/**
 * Create a new organization (with a default public status page) for a brand-new
 * account. Returns the created org.
 */
export async function provisionOrg(orgName: string, ownerName: string) {
  const name = orgName?.trim() || `${ownerName}'s Organization`;
  const slug = await uniqueSlug(orgName || ownerName);

  const org = await prisma.org.create({ data: { name, slug, plan: "free" } });
  await prisma.statusPage.create({
    data: { orgId: org.id, slug, title: `${name} Status`, isPublic: true },
  });
  return org;
}
