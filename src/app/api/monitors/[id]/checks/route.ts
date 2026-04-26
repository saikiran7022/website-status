import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const checks = await prisma.checkResult.findMany({
    where: { monitorId: params.id },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  return NextResponse.json(checks);
}
