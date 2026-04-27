import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

async function ensureOwnership(req: NextRequest, id: string) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const orgId = (user as any).orgId;
  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor || monitor.orgId !== orgId) {
    return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  }
  return { monitor, orgId, user };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ensureOwnership(req, id);
  if ((result as any).error) return (result as any).error;
  return NextResponse.json((result as any).monitor);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ensureOwnership(req, id);
  if ((result as any).error) return (result as any).error;
  if ((result as any).user.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

  await prisma.monitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await ensureOwnership(req, id);
  if ((result as any).error) return (result as any).error;

  const body = await req.json();
  const updated = await prisma.monitor.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.interval !== undefined && { interval: body.interval }),
    },
  });
  return NextResponse.json(updated);
}
