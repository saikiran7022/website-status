import { NextRequest, NextResponse } from "next/server";
import { runDueChecks } from "@/lib/checker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Serverless-friendly check trigger. Hit this on a schedule (Render cron job,
 * GitHub Action, Vercel cron, …). Protected by the CRON_SECRET env var: send it
 * as `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const query = req.nextUrl.searchParams.get("secret");
    if (header !== secret && query !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await runDueChecks();
  return NextResponse.json({
    ok: true,
    checked: results.length,
    results: results.map((r) => ({ monitor: r.monitor.name, status: r.result.status })),
  });
}

export const GET = handle;
export const POST = handle;
