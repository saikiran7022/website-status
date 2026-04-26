import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return NextResponse.redirect(new URL("/login?error=github", request.url));
    }

    // Get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const githubUser = await userRes.json();

    // Get email
    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails = await emailRes.json();
    const primaryEmail = emails.find((e: any) => e.primary)?.email;

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(schema.users.email, primaryEmail),
    });

    if (!user) {
      [user] = await db
        .insert(schema.users)
        .values({
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          githubId: githubUser.id.toString(),
          avatarUrl: githubUser.avatar_url,
          emailVerified: true,
        })
        .returning();

      // Auto-create organization if first user
      const slug = (githubUser.login || "user").toLowerCase();
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: `${githubUser.login}'s Workspace`, slug, plan: "free" })
        .returning();

      await db.insert(schema.memberships).values({
        organizationId: org.id,
        userId: user.id,
        role: "admin",
      });
    }

    await createSession(user.id);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=github", request.url));
  }
}
