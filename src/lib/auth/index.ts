import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken, sha256 } from "./password";
import { SESSION_COOKIE } from "./session";

export * from "./password";
export { getCurrentUser, sessionCookieOptions, SESSION_COOKIE } from "./session";
export type { SessionUser } from "./session";

export interface AuthContext {
  userId: string | null;
  role: string;
  orgId: string | null;
  /** True when the request authenticated with an API key rather than a session. */
  viaApiKey: boolean;
}

/**
 * Authenticate an incoming API request. Supports, in order:
 *   1. `Authorization: Bearer ws_...`  — an API key (org-scoped, admin role)
 *   2. `Authorization: Bearer <jwt>`   — a session JWT (API clients)
 *   3. the `ws_session` cookie         — the browser session
 * Returns null when no valid credential is present.
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    // API key
    if (token.startsWith("ws_")) {
      const apiKey = await prisma.apiKey.findUnique({ where: { hash: sha256(token) } });
      if (!apiKey) return null;
      // Best-effort usage tracking; never block the request on it.
      prisma.apiKey
        .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
        .catch(() => {});
      return { userId: apiKey.createdById, role: "admin", orgId: apiKey.orgId, viaApiKey: true };
    }

    // Session JWT
    const payload = verifyToken(token);
    if (payload) {
      const ctx = await contextFromUser(payload.userId);
      if (ctx) return ctx;
    }
  }

  // Browser cookie
  const cookie = req.cookies.get(SESSION_COOKIE);
  if (cookie?.value) {
    const payload = verifyToken(cookie.value);
    if (payload) {
      const ctx = await contextFromUser(payload.userId);
      if (ctx) return ctx;
    }
  }

  return null;
}

async function contextFromUser(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { userId: user.id, role: user.role, orgId: user.orgId, viaApiKey: false };
}

export function canEdit(role: string): boolean {
  return role === "admin" || role === "editor";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

// ─── GitHub OAuth ──────────────────────────────────────────────────────────

export const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

export function isGitHubConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

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
    headers: { Accept: "application/json", "Content-Type": "application/json" },
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
