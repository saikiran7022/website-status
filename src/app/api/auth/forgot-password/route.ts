import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateVerificationToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Only generate a token for real accounts, but always respond identically to
    // avoid leaking which emails are registered.
    if (user) {
      const token = generateVerificationToken();
      await prisma.verificationToken.create({
        data: {
          email: normalizedEmail,
          token,
          type: "password_reset",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      await sendPasswordResetEmail(normalizedEmail, token);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
