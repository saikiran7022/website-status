import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { testMonitor } from "@/lib/checker";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const monitor = await db.query.monitors.findFirst({
      where: eq(schema.monitors.id, id),
    });

    if (!monitor) return NextResponse.json({ error: "Monitor not found" }, { status: 404 });

    const result = await testMonitor(monitor);

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
