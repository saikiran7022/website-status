#!/usr/bin/env tsx
/**
 * Check Worker - Background uptime checking engine
 * Run with: npm run worker
 *
 * In production, run this as a separate process alongside Next.js.
 * On Render, this can be configured as a background worker service.
 */

import { runAllChecks } from "../src/lib/checker";
import { triggerAlert, resolveAlert, checkForSlowResponse } from "../src/lib/alerts";
import { db } from "../src/lib/db";
import * as schema from "../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

const CHECK_INTERVAL = 30000; // 30 seconds between batch runs

async function checkForActiveIncidents() {
  const monitors = await db.query.monitors.findMany({
    where: eq(schema.monitors.enabled, true),
  });

  for (const monitor of monitors) {
    // Get last 5 checks
    const recentChecks = await db.query.checks.findMany({
      where: eq(schema.checks.monitorId, monitor.id),
      orderBy: [desc(schema.checks.timestamp)],
      limit: 5,
    });

    const allFailed = recentChecks.length >= 3 && recentChecks.every((c) => !c.success);

    if (allFailed) {
      // Check if there's already an active incident
      const activeIncident = await db.query.incidents.findFirst({
        where: and(
          eq(schema.incidents.monitorId, monitor.id),
          eq(schema.incidents.status, "investigating" as const)
        ),
      });

      if (!activeIncident) {
        // Create new incident
        await db.insert(schema.incidents).values({
          organizationId: monitor.organizationId,
          monitorId: monitor.id,
          title: `${monitor.name} is down`,
          status: "investigating",
          severity: "major",
          startedAt: new Date(),
        });

        // Trigger alerts
        await triggerAlert(monitor.id, "down");
        console.log(`[INCIDENT] ${monitor.name} is down - incident created`);
      }
    } else if (recentChecks.length > 0 && recentChecks[0].success) {
      // Monitor is back up - resolve any open incidents
      const activeIncident = await db.query.incidents.findFirst({
        where: and(
          eq(schema.incidents.monitorId, monitor.id),
          eq(schema.incidents.status, "investigating" as const)
        ),
      });

      if (activeIncident) {
        await db.update(schema.incidents)
          .set({ status: "resolved", resolvedAt: new Date() })
          .where(eq(schema.incidents.id, activeIncident.id));

        // Resolve alerts
        await resolveAlert(monitor.id, "down");
        console.log(`[RESOLVED] ${monitor.name} is back up`);
      }
    }

    // Check for slow response
    if (recentChecks.length > 0 && recentChecks[0].success && recentChecks[0].responseTime) {
      await checkForSlowResponse(monitor.id, recentChecks[0].responseTime);
    }
  }
}

async function run() {
  console.log(`[${new Date().toISOString()}] Running uptime checks...`);

  try {
    const results = await runAllChecks();
    console.log(`Checked ${results.length} monitors`);

    for (const { monitor, result } of results) {
      const status = result.success ? "✅ UP" : "❌ DOWN";
      const time = result.responseTime ? `${result.responseTime}ms` : "N/A";
      console.log(`  ${status} ${monitor.name} - ${time}`);
    }

    // Check for incidents to create or resolve
    await checkForActiveIncidents();
  } catch (error) {
    console.error("[ERROR] Check run failed:", error);
  }
}

// Run checks periodically
run(); // Run immediately on start
setInterval(run, CHECK_INTERVAL);

console.log(`Check worker started - checking every ${CHECK_INTERVAL / 1000}s`);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down check worker...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down check worker...");
  process.exit(0);
});
