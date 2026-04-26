import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    // Always return success to prevent email enumeration
    // In production: send email with reset link
    console.log(`Password reset requested for: ${email}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
