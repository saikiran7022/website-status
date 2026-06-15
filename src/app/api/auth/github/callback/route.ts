import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  signToken,
  sessionCookieOptions,
  SESSION_COOKIE,
  exchangeGitHubCode,
  getGitHubUser,
  getGitHubEmails,
  isGitHubConfigured,
} from "@/lib/auth";
import { provisionOrg } from "@/lib/provision";

export async function GET(request: NextRequest) {
  if (!isGitHubConfigured()) {
    return NextResponse.redirect(new URL("/login?error=github_not_configured", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=github_no_code", request.url));
  }

  try {
    const { access_token } = await exchangeGitHubCode(code);
    const githubUser = await getGitHubUser(access_token);

    let email: string | undefined = githubUser.email;
    if (!email) {
      const emails = await getGitHubEmails(access_token);
      email = emails.find((e) => e.primary && e.verified)?.email || emails.find((e) => e.verified)?.email;
    }
    if (!email) {
      return NextResponse.redirect(new URL("/login?error=github_no_email", request.url));
    }
    email = email.toLowerCase();

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const org = await provisionOrg(githubUser.company || "", githubUser.name || githubUser.login);
      user = await prisma.user.create({
        data: {
          email,
          name: githubUser.name || githubUser.login,
          githubId: githubUser.id ? String(githubUser.id) : null,
          emailVerified: true,
          role: "admin",
          orgId: org.id,
        },
      });
    } else if (!user.orgId) {
      const org = await provisionOrg("", user.name);
      user = await prisma.user.update({ where: { id: user.id }, data: { orgId: org.id } });
    }

    const token = signToken(user.id, user.role, user.orgId);
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error: any) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=github_failed", request.url));
  }
}
