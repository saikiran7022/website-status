import { prisma } from './db';
import { hashPassword } from './auth';

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  // Create default org
  let org = await prisma.org.findFirst({ where: { slug: 'default' } });
  if (!org) {
    org = await prisma.org.create({ data: { name: 'Default Organization', slug: 'default' } });
    console.log('[seed] Org created:', org.name);
  }

  // Create admin user in org
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, name: 'Admin', password: await hashPassword(password), role: 'admin', orgId: org.id },
    });
    console.log('[seed] Admin user created:', email);
  }

  // Seed monitors for the org
  const defaults = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Example', url: 'https://example.com' },
  ];
  for (const d of defaults) {
    const exists = await prisma.monitor.findFirst({ where: { url: d.url, orgId: org.id } });
    if (!exists) {
      await prisma.monitor.create({ data: { ...d, orgId: org.id, interval: 5 } });
      console.log('[seed] Monitor created:', d.name);
    }
  }
  console.log('[seed] Done.');
}

seed().catch(console.error);
