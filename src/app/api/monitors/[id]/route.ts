import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  await prisma.monitor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
