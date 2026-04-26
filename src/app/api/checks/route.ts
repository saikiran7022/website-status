import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const monitorId = searchParams.get('monitorId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const where = monitorId ? { monitorId } : {};
  const checks = await prisma.checkResult.findMany({
    where, orderBy: { timestamp: 'desc' }, take: limit,
    include: { monitor: { select: { name: true } } },
  });
  return NextResponse.json(checks);
}
