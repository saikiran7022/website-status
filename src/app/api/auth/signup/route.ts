import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, generateVerificationToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { provisionOrg } from "@/lib/provision";
import { sendVerificationEmail } from "@/lib/notifications";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, orgName } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email and password are required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });
    }

    const org = await provisionOrg(orgName, name);
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        password: await hashPassword(password),
        role: "admin",
        orgId: org.id,
      },
    });

    // Fire-and-forget email verification (no-op if email isn't configured).
    try {
      const token = generateVerificationToken();
      await prisma.verificationToken.create({
        data: {
          email: normalizedEmail,
          token,
          type: "email_verify",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendVerificationEmail(normalizedEmail, token);
    } catch (err) {
      console.error("[signup] verification email failed:", err);
    }

    const jwt = signToken(user.id, user.role, org.id);
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, orgId: org.id },
    });
    response.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions());
    return response;
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
