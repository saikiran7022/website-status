import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getAuthUser, verifyToken } from '@/lib/auth';

async function getAuthenticatedUser(req: NextRequest) {
  // Try Bearer token first (API clients)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').replace('bearer ', '');
    const payload = verifyToken(token);
    if (payload) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { org: true } });
      return user ? { ...user, role: payload.role, orgId: payload.orgId } : null;
    }
  }

  // Try cookie (frontend)
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('ws_session');
    if (session) {
      const payload = verifyToken(session.value);
      if (payload) {
        const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { org: true } });
        return user ? { ...user, role: payload.role, orgId: payload.orgId } : null;
      }
    }
  } catch {
    // cookies() not available in some contexts
  }

  return null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = (user as any).orgId;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const monitors = await prisma.monitor.findMany({
    where: { orgId },
    include: { _count: { select: { checkResults: true, incidents: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(monitors);
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || (user as any).role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

  const orgId = (user as any).orgId;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { name, url, interval } = await req.json();
  const monitor = await prisma.monitor.create({
    data: { name, url, orgId, interval: interval || 5 },
  });
  return NextResponse.json(monitor, { status: 201 });
}
