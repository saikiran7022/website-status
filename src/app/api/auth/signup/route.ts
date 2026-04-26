import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, generateVerificationToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, orgName } = await request.json();

    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [user] = await db
      .insert(schema.users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        emailVerified: false,
      })
      .returning();

    const [org] = await db
      .insert(schema.organizations)
      .values({ name: orgName, slug, plan: "free" })
      .returning();

    await db.insert(schema.memberships).values({
      organizationId: org.id,
      userId: user.id,
      role: "admin",
    });

    await createSession(user.id);

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
