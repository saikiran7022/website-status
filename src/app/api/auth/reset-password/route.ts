import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record || record.type !== "password_reset" || record.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset link" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset link" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } }),
      prisma.verificationToken.deleteMany({ where: { email: record.email, type: "password_reset" } }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
