import { prisma } from '@/lib/db';

export async function createSession(userId: string) {
  // Sessions are handled via JWT cookies in this implementation
  return { userId };
}

export async function getSession(sessionId: string) {
  // Not used - JWT is stored in cookies
  return null;
}

export async function deleteSession(sessionId: string) {
  return;
}

export async function invalidateSession(sessionId: string) {
  return;
}

export async function getCurrentUser(token: string | undefined) {
  return null;
}
