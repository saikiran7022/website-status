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

export interface TokenPayload {
  userId: string;
  role: string;
  orgId?: string;
}

export function signToken(userId: string, role: string, orgId?: string): string {
  const payload: TokenPayload = { userId, role };
  if (orgId) payload.orgId = orgId;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(token: string | undefined) {
  if (!token) return null;
  const payload = verifyToken(token.replace('Bearer ', ''));
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId }, include: { org: true } });
}

export { createSession, getSession, invalidateSession, getCurrentUser } from "./auth/session";
export { generateSessionToken, createSessionTokenHash, generateVerificationToken, generateAPIKey } from "./auth/password";

export const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

export function getGitHubAuthURL(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: "user:email",
  });
  return `${GITHUB_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string): Promise<{ access_token: string }> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    }),
  });
  return response.json();
}

export async function getGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  return response.json();
}

export async function getGitHubEmails(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  return response.json() as Promise<Array<{ email: string; primary: boolean; verified: boolean }>>;
}
