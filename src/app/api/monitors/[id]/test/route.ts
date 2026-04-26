import { NextRequest, NextResponse } from 'next/server';
import { testMonitor } from '@/lib/checker/index';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const monitor = await prisma.monitor.findUnique({ where: { id: params.id } });
  if (!monitor) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
  const result = await testMonitor(monitor);
  return NextResponse.json(result);
}
