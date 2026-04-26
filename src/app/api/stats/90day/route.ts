import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get('monitorId');

  const days: { date: string; status: string }[] = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const checks = await prisma.checkResult.findMany({
      where: { monitorId: monitorId!, timestamp: { gte: date, lt: next } },
    });

    if (checks.length === 0) {
      days.push({ date: date.toISOString().split('T')[0], status: 'unknown' });
    } else {
      const upCount = checks.filter(c => c.status === 'up' || c.status === 'degraded').length;
      const ratio = upCount / checks.length;
      days.push({
        date: date.toISOString().split('T')[0],
        status: ratio >= 0.95 ? 'up' : ratio >= 0.5 ? 'degraded' : 'down',
      });
    }
  }

  return NextResponse.json(days);
}
