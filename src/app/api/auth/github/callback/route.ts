import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import {
  exchangeGitHubCode,
  getGitHubUser,
  getGitHubEmails,
} from "@/lib/auth/index";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=github_no_code", request.url));
  }

  try {
    // Exchange code for access token
    const { access_token } = await exchangeGitHubCode(code);

    // Get user profile
    const githubUser = await getGitHubUser(access_token);
    if (!githubUser.email && githubUser.id) {
      // Try to get email from emails endpoint
      const emails = await getGitHubEmails(access_token);
      const primary = emails.find((e: any) => e.primary && e.verified);
      githubUser.email = primary?.email;
    }

    if (!githubUser.email) {
      return NextResponse.redirect(
        new URL("/login?error=github_no_email", request.url)
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: githubUser.email.toLowerCase() },
      include: { org: true },
    });

    let orgId: string;

    if (!user) {
      // Create org and user
      const orgName = githubUser.company || `${githubUser.name || githubUser.login}'s Organization`;
      const org = await prisma.org.create({
        data: { name: orgName, slug: slugify(orgName) },
      });
      orgId = org.id;

      user = await prisma.user.create({
        data: {
          email: githubUser.email.toLowerCase(),
          name: githubUser.name || githubUser.login,
          password: `github_oauth_${access_token.substring(0, 20)}`,
          role: "admin",
          orgId: org.id,
        },
        include: { org: true },
      });
    } else {
      orgId = (user as any).orgId;
      if (!orgId) {
        // Existing user without org — create one
        let org = await prisma.org.findFirst({ where: { slug: slugify(githubUser.login) } });
        if (!org) {
          org = await prisma.org.create({
            data: { name: `${githubUser.name || githubUser.login}'s Org`, slug: slugify(githubUser.login) },
          });
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { orgId: org.id },
        });
        orgId = org.id;
      }
    }

    // Sign token and set cookie
    const token = signToken(user.id, user.role, orgId);
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("ws_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=github_${error.message || "unknown"}`, request.url)
    );
  }
}
