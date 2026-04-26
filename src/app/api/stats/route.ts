import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = (user as any).orgId;
  const monitors = await prisma.monitor.findMany({
    where: { orgId },
  });
  const stats: Record<string, any> = {};

  for (const m of monitors) {
    const now = new Date();
    const periods = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };

    const results: Record<string, any[]> = {};
    for (const [key, since] of Object.entries(periods)) {
      results[key] = await prisma.checkResult.findMany({
        where: { monitorId: m.id, timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
      });
    }

    const calcUptime = (checks: any[]) => {
      if (checks.length === 0) return 100;
      const up = checks.filter(c => c.status === 'up' || c.status === 'degraded').length;
      return (up / checks.length) * 100;
    };

    const last = results['24h'][0];
    const avgResp = results['24h'].length > 0
      ? results['24h'].reduce((sum: number, c: any) => sum + c.responseTime, 0) / results['24h'].length
      : 0;

    stats[m.id] = {
      monitorId: m.id,
      uptime24h: calcUptime(results['24h']),
      uptime7d: calcUptime(results['7d']),
      uptime30d: calcUptime(results['30d']),
      avgResponseTime: Math.round(avgResp),
      lastStatus: last?.status || 'unknown',
      lastChecked: last?.timestamp || null,
    };
  }

  return NextResponse.json(stats);
}
