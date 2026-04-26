import { cookies } from "next/headers";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, gt, and } from "drizzle-orm";
import { generateSessionToken, createSessionTokenHash } from "./password";

const SESSION_COOKIE_NAME = "ws_session";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  githubId: string | null;
  avatarUrl: string | null;
}

// In-memory session store for simplicity (use Redis/DB in production)
const sessions = new Map<string, { session: Session; user: SessionUser }>();

export async function createSession(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (!user) throw new Error("User not found");

  const token = generateSessionToken();
  const session = {
    id: token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_DURATION),
  };

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified ?? false,
    githubId: user.githubId ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };

  sessions.set(token, { session, user: sessionUser });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Math.floor(SESSION_DURATION / 1000),
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<{ session: Session; user: SessionUser } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const stored = sessions.get(token);
  if (!stored) return null;

  if (stored.session.expiresAt < new Date()) {
    sessions.delete(token);
    return null;
  }

  return stored;
}

export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    sessions.delete(token);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function requireAuth(): { session: Session; user: SessionUser } {
  throw new Error("requireAuth must be called from server component");
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const result = await getSession();
  return result?.user ?? null;
}
