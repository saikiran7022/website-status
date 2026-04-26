export { hashPassword, verifyPassword, generateSessionToken, createSessionTokenHash, generateVerificationToken, generateAPIKey } from "./password";
export { createSession, getSession, invalidateSession, getCurrentUser } from "./session";

export const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
export const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

export function getGitHubAuthURL(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
    scope: "user:email",
  });
  return `${GITHUB_OAUTH_URL}?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string): Promise<{ access_token: string }> {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    }),
  });
  return response.json();
}

export async function getGitHubUser(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  return response.json();
}

export async function getGitHubEmails(accessToken: string) {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  return response.json() as Promise<Array<{ email: string; primary: boolean; verified: boolean }>>;
}
