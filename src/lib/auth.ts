import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-random-string';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(token: string | undefined) {
  if (!token) return null;
  const payload = verifyToken(token.replace('Bearer ', ''));
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}
