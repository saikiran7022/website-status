import { NextRequest, NextResponse } from "next/server";
import { performCheck } from "@/lib/checker";
import { requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

// POST /api/monitors/test — run an ad-hoc check (without saving) for the new-monitor form.
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body?.url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const result = await performCheck({
    id: "test",
    url: String(body.url),
    method: body.method,
    timeout: body.timeout ? Number(body.timeout) : 15000,
    expectedStatus: body.expectedStatus ? Number(body.expectedStatus) : null,
    keyword: body.keyword || null,
    headers: body.headers || null,
    body: body.body || null,
  });
  return NextResponse.json(result);
}
