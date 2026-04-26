import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req.headers.get('authorization') || undefined);
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin required' }, { status: 403 });
  const { email, name, password, role } = await req.json();
  const u = await prisma.user.create({
    data: { email, name, password: await hashPassword(password), role: role || 'viewer' },
  });
  return NextResponse.json({ id: u.id, email: u.email, name: u.name, role: u.role }, { status: 201 });
}
