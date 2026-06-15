import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, type AuthContext } from "@/lib/auth";

export interface AuthedContext extends AuthContext {
  orgId: string;
}

/**
 * Resolve the auth context for an API route. Returns either an `error` response
 * to return immediately, or a `ctx` guaranteed to have an `orgId`.
 */
export async function requireAuth(
  req: NextRequest,
  opts: { roles?: string[] } = {}
): Promise<{ error: NextResponse } | { ctx: AuthedContext }> {
  const ctx = await authenticateRequest(req);
  if (!ctx) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!ctx.orgId) return { error: NextResponse.json({ error: "No organization" }, { status: 400 }) };
  if (opts.roles && !opts.roles.includes(ctx.role)) {
    return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
  }
  return { ctx: { ...ctx, orgId: ctx.orgId } };
}
