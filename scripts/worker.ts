/**
 * Background check worker
 * Runs periodically to check all active monitors.
 * Can be invoked via cron on Render or run standalone.
 */

import { runAllChecks } from '../src/lib/checker';

async function main() {
  console.log(`[worker] Starting check cycle at ${new Date().toISOString()}`);
  try {
    const results = await runAllChecks();
    console.log(`[worker] Completed ${results.length} checks`);
    for (const r of results) {
      console.log(`[worker] ${r.monitor.name}: ${r.result.status === 'up' ? 'OK' : 'FAIL'} (${r.result.responseTime}ms)`);
    }
  } catch (err) {
    console.error('[worker] Error:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();
