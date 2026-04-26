import { prisma } from './db';

async function checkUrl(url: string): Promise<{ status: string; statusCode: number | null; responseTime: number; error: string | null }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'WebsiteStatusBot/1.0' },
    });
    clearTimeout(timeout);
    const responseTime = Date.now() - start;
    if (res.status >= 200 && res.status < 400) {
      return { status: res.status < 300 ? 'up' : 'degraded', statusCode: res.status, responseTime, error: null };
    }
    return { status: 'down', statusCode: res.status, responseTime, error: `HTTP ${res.status}` };
  } catch (e: any) {
    return { status: 'down', statusCode: null, responseTime: Date.now() - start, error: e.message || 'Connection failed' };
  }
}

export async function testMonitor(monitor: { id: string; url: string; timeout?: number | null }) {
  return checkUrl(monitor.url);
}

export async function runAllChecks() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  console.log(`[checker] Running ${monitors.length} checks...`);
  for (const m of monitors) {
    const result = await checkUrl(m.url);
    await prisma.checkResult.create({
      data: { monitorId: m.id, ...result },
    });
    // Auto-create incident on new failure
    if (result.status === 'down') {
      const recentDown = await prisma.checkResult.count({
        where: { monitorId: m.id, status: 'down', timestamp: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      });
      if (recentDown === 1) {
        await prisma.incident.create({
          data: { monitorId: m.id, title: `${m.name} is down`, description: result.error, severity: 'critical' },
        });
      }
    }
    console.log(`[checker] ${m.name} (${m.url}): ${result.status} ${result.responseTime}ms`);
  }
}
