import { prisma } from './db';
import { hashPassword } from './auth';

async function seed() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, name: 'Admin', password: await hashPassword(password), role: 'admin' },
    });
    console.log('[seed] Admin user created:', email);
  }

  const defaults = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Example', url: 'https://example.com' },
  ];
  for (const d of defaults) {
    const exists = await prisma.monitor.findUnique({ where: { url: d.url } });
    if (!exists) {
      await prisma.monitor.create({ data: { ...d, interval: 5 } });
      console.log('[seed] Monitor created:', d.name);
    }
  }
  console.log('[seed] Done.');
}

seed().catch(console.error);
