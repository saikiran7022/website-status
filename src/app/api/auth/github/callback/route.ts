import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // GitHub OAuth callback - redirect to login for now
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}
