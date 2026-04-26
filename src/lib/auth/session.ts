import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ws_session');
  if (!token) return null;

  const payload = verifyToken(token.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { org: true },
  });

  if (!user) return null;
  return { ...user, role: payload.role, orgId: payload.orgId };
}

export function getSession(_sessionId: string) {
  return null;
}

export function invalidateSession(_sessionId: string) {
  return;
}

export function deleteSession(_sessionId: string) {
  return;
}

export function createSession(_userId: string) {
  return {};
}
