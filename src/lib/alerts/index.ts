import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export interface AlertConfig {
  emails?: string[];
  webhookUrl?: string;
  slowResponseThreshold?: number; // ms
  sslExpiryThreshold?: number; // days
}

export async function triggerAlert(
  monitorId: string,
  type: "down" | "slow_response" | "ssl_expiry",
  details?: Record<string, unknown>
) {
  const alerts = await db.query.alerts.findMany({
    where: eq(schema.alerts.monitorId, monitorId),
  });

  const relevantAlerts = alerts.filter((a) => a.type === type && a.enabled);

  for (const alert of relevantAlerts) {
    const config = alert.config as AlertConfig;

    // Create alert history record
    await db.insert(schema.alertHistory).values({
      alertId: alert.id,
      monitorId,
      triggeredAt: new Date(),
      status: "triggered",
    });

    // Send notifications
    if (alert.channel === "email" && config.emails) {
      await sendEmailNotification(config.emails, monitorId, type, details);
    } else if (alert.channel === "webhook" && config.webhookUrl) {
      await sendWebhookNotification(config.webhookUrl, monitorId, type, details);
    }
  }
}

export async function resolveAlert(
  monitorId: string,
  type: "down" | "slow_response" | "ssl_expiry"
) {
  const alerts = await db.query.alerts.findMany({
    where: eq(schema.alerts.monitorId, monitorId),
  });

  const relevantAlerts = alerts.filter((a) => a.type === type && a.enabled);

  for (const alert of relevantAlerts) {
    // Find the most recent triggered alert history entry
    const alertHistory = await db.query.alertHistory.findFirst({
      where: eq(schema.alertHistory.alertId, alert.id),
    });

    if (alertHistory && alertHistory.status === "triggered") {
      await db
        .update(schema.alertHistory)
        .set({
          resolvedAt: new Date(),
          status: "resolved",
        })
        .where(eq(schema.alertHistory.id, alertHistory.id));
    }
  }
}

async function sendEmailNotification(
  emails: string[],
  monitorId: string,
  type: string,
  details?: Record<string, unknown>
) {
  const monitor = await db.query.monitors.findFirst({
    where: eq(schema.monitors.id, monitorId),
  });

  if (!monitor) return;

  const subject = `[WebsiteStatus] ${type === "down" ? "🔴 DOWN" : type === "slow_response" ? "🟡 SLOW" : "🔒 SSL"}: ${monitor.name}`;

  const body = `
    Alert triggered for monitor: ${monitor.name}
    URL: ${monitor.url}
    Type: ${type}
    Time: ${new Date().toISOString()}
    ${details ? `Details: ${JSON.stringify(details, null, 2)}` : ""}
  `;

  // In production, use a proper email service (SendGrid, AWS SES, etc.)
  console.log(`[Email Notification] To: ${emails.join(", ")} | Subject: ${subject} | Body: ${body}`);
}

async function sendWebhookNotification(
  webhookUrl: string,
  monitorId: string,
  type: string,
  details?: Record<string, unknown>
) {
  const monitor = await db.query.monitors.findFirst({
    where: eq(schema.monitors.id, monitorId),
  });

  if (!monitor) return;

  const payload = {
    monitor: {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
    },
    alertType: type,
    timestamp: new Date().toISOString(),
    details,
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`[Webhook Error] Failed to send webhook to ${webhookUrl}:`, error);
  }
}

export async function checkForSlowResponse(
  monitorId: string,
  responseTime: number
) {
  const alerts = await db.query.alerts.findMany({
    where: eq(schema.alerts.monitorId, monitorId),
  });

  const slowResponseAlerts = alerts.filter(
    (a) => a.type === "slow_response" && a.enabled
  );

  for (const alert of slowResponseAlerts) {
    const config = alert.config as AlertConfig;
    if (config.slowResponseThreshold && responseTime > config.slowResponseThreshold) {
      await triggerAlert(monitorId, "slow_response", {
        responseTime,
        threshold: config.slowResponseThreshold,
      });
    }
  }
}

export async function checkForSSLCertExpiry(
  monitorId: string
) {
  // This would check SSL certificate expiration in production
  // For now, it's a placeholder that would be called by a scheduled task
  const alerts = await db.query.alerts.findMany({
    where: eq(schema.alerts.monitorId, monitorId),
  });

  const sslAlerts = alerts.filter(
    (a) => a.type === "ssl_expiry" && a.enabled
  );

  if (sslAlerts.length > 0) {
    // In production, would check actual SSL cert expiry
    // For now, skip
  }
}
