import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function createSessionTokenHash(token: string): string {
  const hash = new Uint8Array(32);
  crypto.getRandomValues(hash);
  return Array.from(hash, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateVerificationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function generateAPIKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `ws_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
}

export interface TokenPayload {
  userId: string;
  role: string;
  orgId?: string;
}

export function signToken(userId: string, role: string, orgId?: string): string {
  const payload: TokenPayload = { userId, role };
  if (orgId) payload.orgId = orgId;
  return jwt.sign(payload, process.env.JWT_SECRET || 'change-me', { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'change-me') as TokenPayload;
  } catch {
    return null;
  }
}
