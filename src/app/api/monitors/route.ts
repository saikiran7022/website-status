import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const monitors = await prisma.monitor.findMany({
    include: { _count: { select: { checkResults: true, incidents: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(monitors);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  const { name, url, interval } = await req.json();
  const monitor = await prisma.monitor.create({ data: { name, url, interval: interval || 5 } });
  return NextResponse.json(monitor, { status: 201 });
}
