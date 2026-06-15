import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function consume(token: string | null) {
  if (!token) {
    return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
  }
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== "email_verify" || record.expiresAt < new Date()) {
    return NextResponse.json({ success: false, error: "Invalid or expired verification link" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.updateMany({ where: { email: record.email }, data: { emailVerified: true } }),
    prisma.verificationToken.deleteMany({ where: { email: record.email, type: "email_verify" } }),
  ]);

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  return consume(request.nextUrl.searchParams.get("token"));
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    return consume(token);
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
