/**
 * Background check worker.
 *
 * Runs as a long-lived process and uses node-cron to check due monitors on a
 * fixed cadence (every minute by default). Each monitor is only checked once
 * its own configured interval has elapsed, so per-monitor intervals are honored.
 *
 * Deploy this as a Render "worker" service (see render.yaml). For one-off runs
 * (e.g. a serverless cron hitting /api/cron) use the `runDueChecks` export
 * directly instead.
 */
import cron from "node-cron";
import { runDueChecks } from "../src/lib/checker";

const SCHEDULE = process.env.WORKER_CRON || "* * * * *"; // every minute
let running = false;

async function tick() {
  if (running) {
    console.log("[worker] previous cycle still running, skipping tick");
    return;
  }
  running = true;
  const startedAt = new Date();
  try {
    const results = await runDueChecks();
    if (results.length > 0) {
      console.log(`[worker] ${startedAt.toISOString()} checked ${results.length} monitor(s)`);
      for (const r of results) {
        console.log(`[worker]   ${r.monitor.name}: ${r.result.status} (${r.result.responseTime}ms)`);
      }
    }
  } catch (err) {
    console.error("[worker] cycle error:", err);
  } finally {
    running = false;
  }
}

console.log(`[worker] starting with schedule "${SCHEDULE}"`);
cron.schedule(SCHEDULE, tick);
// Run an initial cycle immediately so a fresh deploy starts checking right away.
tick();

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
