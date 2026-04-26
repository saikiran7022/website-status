import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const checks = await db.query.checks.findMany({
      where: eq(schema.checks.monitorId, id),
      orderBy: [desc(schema.checks.timestamp)],
      limit,
    });

    return NextResponse.json({ checks });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
