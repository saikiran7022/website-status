import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, orgName } = await req.json();
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });
    }

    const org = await prisma.org.create({
      data: {
        name: orgName || `${name}'s Organization`,
        slug: slugify(orgName || name),
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: await hashPassword(password),
        role: 'admin',
        orgId: org.id,
      },
    });

    const token = signToken(user.id, user.role, org.id);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, orgId: org.id },
    });
    response.cookies.set('ws_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
