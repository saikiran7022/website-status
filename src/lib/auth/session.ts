import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyToken } from "./password";

export const SESSION_COOKIE = "ws_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId: string | null;
  emailVerified: boolean;
  org: { id: string; name: string; slug: string; plan: string } | null;
}

/**
 * Resolve the currently authenticated user from the session cookie.
 * Returns null when there is no valid session. The user's role/orgId always
 * reflect the current database row (not the possibly-stale JWT payload).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  if (!token?.value) return null;

  const payload = verifyToken(token.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { org: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    emailVerified: user.emailVerified,
    org: user.org
      ? { id: user.org.id, name: user.org.name, slug: user.org.slug, plan: user.org.plan }
      : null,
  };
}

export function sessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: maxAgeSeconds,
    path: "/",
  };
}
