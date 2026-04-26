import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = signToken(user.id, user.role);
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
