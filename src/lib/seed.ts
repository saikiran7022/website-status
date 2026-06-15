import { prisma } from "./db";
import { hashPassword } from "./auth";

/**
 * Seed a demo organization with an admin user and a few public monitors.
 * Safe to run repeatedly — every step is idempotent.
 */
async function seed() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin12345";

  let org = await prisma.org.findFirst({ where: { slug: "default" } });
  if (!org) {
    org = await prisma.org.create({ data: { name: "Default Organization", slug: "default", plan: "pro" } });
    console.log("[seed] Org created:", org.name);
  }

  const existingPage = await prisma.statusPage.findUnique({ where: { orgId: org.id } });
  if (!existingPage) {
    await prisma.statusPage.create({
      data: { orgId: org.id, slug: org.slug, title: `${org.name} Status`, isPublic: true },
    });
    console.log("[seed] Status page created");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: "Admin",
        password: await hashPassword(password),
        role: "admin",
        emailVerified: true,
        orgId: org.id,
      },
    });
    console.log(`[seed] Admin user created: ${email} (password: ${password})`);
  }

  const defaults = [
    { name: "Google", url: "https://www.google.com" },
    { name: "GitHub", url: "https://github.com" },
    { name: "Example", url: "https://example.com" },
  ];
  for (const d of defaults) {
    const exists = await prisma.monitor.findFirst({ where: { url: d.url, orgId: org.id } });
    if (!exists) {
      await prisma.monitor.create({ data: { ...d, orgId: org.id, interval: 5 } });
      console.log("[seed] Monitor created:", d.name);
    }
  }

  console.log("[seed] Done.");
}

seed()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
