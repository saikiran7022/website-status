import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { generateVerificationToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });

    // Always return success to prevent email enumeration
    if (user) {
      const token = generateVerificationToken();
      await db.insert(schema.passwordResets).values({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      });
      // In production: send email with reset link
      console.log(`Password reset token for ${email}: ${token}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
