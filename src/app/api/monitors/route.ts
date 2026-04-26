import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { testMonitor } from "@/lib/checker";
import { getCurrentUser } from "@/lib/auth";

// GET /api/monitors - List monitors for current org
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.query.memberships.findFirst({
      where: eq(schema.memberships.userId, user.id),
    });

    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });

    const monitors = await db.query.monitors.findMany({
      where: eq(schema.monitors.organizationId, membership.organizationId),
      orderBy: (monitors, { desc }) => [desc(monitors.createdAt)],
    });

    return NextResponse.json({ monitors });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/monitors - Create monitor
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const membership = await db.query.memberships.findFirst({
      where: eq(schema.memberships.userId, user.id),
    });

    if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });

    const body = await request.json();
    const [monitor] = await db
      .insert(schema.monitors)
      .values({
        organizationId: membership.organizationId,
        name: body.name,
        url: body.url,
        type: body.type || "https",
        method: body.method || "GET",
        interval: body.interval || 300,
        timeout: body.timeout || 30000,
        expectedStatusCode: body.expectedStatusCode || 200,
        keyword: body.keyword || null,
        headers: body.headers ? JSON.stringify(body.headers) : null,
        body: body.body || null,
        enabled: body.enabled ?? true,
      })
      .returning();

    return NextResponse.json({ monitor });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
