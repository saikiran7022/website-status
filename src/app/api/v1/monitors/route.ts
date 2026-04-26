import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // For public API, check if user has an API key header
  const monitors = await prisma.monitor.findMany({
    where: { orgId: (user as any).orgId || undefined },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(monitors);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || (user as any).role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

  const orgId = (user as any).orgId;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { name, url, interval } = await req.json();
  const monitor = await prisma.monitor.create({
    data: { name, url, orgId, interval: interval || 5 },
  });
  return NextResponse.json(monitor, { status: 201 });
}
