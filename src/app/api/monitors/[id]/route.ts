import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || (user as any).role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

  const orgId = (user as any).orgId;
  const monitor = await prisma.monitor.findUnique({ where: { id: params.id } });
  if (!monitor || monitor.orgId !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.monitor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
