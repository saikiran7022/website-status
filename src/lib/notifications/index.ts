import { prisma } from "@/lib/db";
import { sendEmail, appUrl } from "./email";
import { sendWebhook } from "./webhook";

export { sendEmail, isEmailConfigured, appUrl } from "./email";
export { sendWebhook } from "./webhook";

export type IncidentEvent = "incident_open" | "incident_resolved";

interface IncidentAlertInput {
  orgId: string;
  event: IncidentEvent;
  monitor: { id: string; name: string; url: string };
  incident: { id: string; title: string; severity: string };
  error?: string | null;
}

/**
 * Fan out an incident notification to every enabled alert channel for the org.
 * Each delivery attempt is recorded in AlertDelivery for an audit trail.
 */
export async function dispatchIncidentAlert(input: IncidentAlertInput): Promise<void> {
  const channels = await prisma.alertChannel.findMany({
    where: { orgId: input.orgId, enabled: true },
  });
  if (channels.length === 0) return;

  const opened = input.event === "incident_open";
  const subject = opened
    ? `🔴 ${input.monitor.name} is DOWN`
    : `✅ ${input.monitor.name} has RECOVERED`;
  const monitorUrl = appUrl(`/dashboard/monitors/${input.monitor.id}`);

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="margin:0 0 8px">${opened ? "Incident opened" : "Incident resolved"}</h2>
      <p style="margin:0 0 4px"><strong>${input.monitor.name}</strong> (${input.monitor.url})</p>
      <p style="margin:0 0 4px">Status: <strong>${opened ? "DOWN" : "UP"}</strong></p>
      ${input.error ? `<p style="margin:0 0 4px">Error: ${escapeHtml(input.error)}</p>` : ""}
      <p style="margin:12px 0"><a href="${monitorUrl}">View monitor →</a></p>
    </div>`;

  const payload = {
    event: input.event,
    monitor: input.monitor,
    incident: input.incident,
    error: input.error ?? null,
    timestamp: new Date().toISOString(),
  };

  await Promise.all(
    channels.map(async (channel) => {
      let success = false;
      let error: string | undefined;
      try {
        if (channel.type === "email") {
          const result = await sendEmail({ to: channel.target, subject, html });
          success = result.sent;
          error = result.error || (result.skipped ? "email not configured" : undefined);
        } else if (channel.type === "webhook") {
          const result = await sendWebhook(channel.target, payload);
          success = result.sent;
          error = result.error;
        }
      } catch (err: any) {
        error = err?.message || "delivery failed";
      }
      await prisma.alertDelivery.create({
        data: {
          orgId: input.orgId,
          channel: channel.type,
          target: channel.target,
          event: input.event,
          success,
          error: error ?? null,
        },
      });
    })
  );
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const link = appUrl(`/verify-email?token=${token}`);
  await sendEmail({
    to: email,
    subject: "Verify your WebsiteStatus email",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2>Confirm your email</h2>
        <p>Welcome to WebsiteStatus! Click below to verify your email address.</p>
        <p style="margin:16px 0"><a href="${link}">Verify email →</a></p>
        <p style="color:#666;font-size:13px">If you didn't create an account you can ignore this email.</p>
      </div>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const link = appUrl(`/reset-password?token=${token}`);
  await sendEmail({
    to: email,
    subject: "Reset your WebsiteStatus password",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2>Reset your password</h2>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <p style="margin:16px 0"><a href="${link}">Reset password →</a></p>
        <p style="color:#666;font-size:13px">If you didn't request this you can safely ignore this email.</p>
      </div>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
