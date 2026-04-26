import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const incidents = await prisma.incident.findMany({
    include: { monitor: { select: { name: true, url: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(incidents);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || !['admin', 'editor'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { monitorId, title, description, severity } = await req.json();
  const incident = await prisma.incident.create({
    data: { monitorId, title, description, severity: severity || 'warning' },
  });
  return NextResponse.json(incident, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || !['admin', 'editor'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, status } = await req.json();
  const incident = await prisma.incident.update({
    where: { id },
    data: { status, resolvedAt: status === 'resolved' ? new Date() : null },
  });
  return NextResponse.json(incident);
}
