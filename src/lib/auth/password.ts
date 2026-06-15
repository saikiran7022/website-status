import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";

/**
 * The JWT signing secret. In production a strong secret MUST be provided via the
 * JWT_SECRET environment variable — the insecure fallback is only used in
 * development/test so the app can boot without configuration.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set to a strong value in production");
    }
    return "dev-insecure-secret-change-me";
  }
  return secret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(password, hash);
}

export interface TokenPayload {
  userId: string;
  role: string;
  orgId?: string;
}

export function signToken(userId: string, role: string, orgId?: string | null): string {
  const payload: TokenPayload = { userId, role };
  if (orgId) payload.orgId = orgId;
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

/** Deterministic SHA-256 hash, used to store API keys without keeping the plaintext. */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** A random opaque token, hex-encoded. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function generateVerificationToken(): string {
  return randomToken(32);
}

/**
 * Generate a new API key. Returns the plaintext key (shown to the user exactly
 * once), a short prefix for display, and the sha256 hash to persist.
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = randomToken(24);
  const key = `ws_${raw}`;
  return { key, prefix: `ws_${raw.slice(0, 6)}`, hash: sha256(key) };
}
