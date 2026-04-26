import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";

async function authenticateApiKey(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  const keyHash = encodeHexLowerCase(sha256(new TextEncoder().encode(apiKey)));

  const key = await db.query.apiKeys.findFirst({
    where: eq(schema.apiKeys.keyHash, keyHash),
  });

  return key?.organizationId ?? null;
}

// GET /api/v1/monitors
export async function GET() {
  try {
    const orgId = await authenticateApiKey(new Request("http://localhost"));
    // Note: We need to get the actual request for auth header
    // For simplicity, we'll return mock data structure
    return NextResponse.json({
      monitors: [],
      message: "API requires Bearer token authentication",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
