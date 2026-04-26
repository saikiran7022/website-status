import { NextResponse } from "next/server";
import { invalidateSession } from "@/lib/auth";

export async function POST() {
  await invalidateSession();
  return NextResponse.json({ success: true });
}
