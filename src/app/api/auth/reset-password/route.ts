import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    const resetRecord = await db.query.passwordResets.findFirst({
      where: and(eq(schema.passwordResets.token, token), gt(schema.passwordResets.expiresAt, new Date())),
    });

    if (!resetRecord) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await db.update(schema.users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, resetRecord.userId));

    await db.delete(schema.passwordResets).where(eq(schema.passwordResets.id, resetRecord.id));

    await createSession(resetRecord.userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
