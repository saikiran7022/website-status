import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const verification = await db.query.emailVerifications.findFirst({
      where: and(eq(schema.emailVerifications.token, token), gt(schema.emailVerifications.expiresAt, new Date())),
    });

    if (!verification) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 });
    }

    await db.update(schema.users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(schema.users.id, verification.userId));

    await db.delete(schema.emailVerifications).where(eq(schema.emailVerifications.id, verification.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
