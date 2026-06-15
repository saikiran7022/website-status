/**
 * Transactional email.
 *
 * Uses the Resend HTTP API when RESEND_API_KEY and EMAIL_FROM are configured.
 * Resend is called over plain `fetch`, so no extra dependency is required and it
 * works in serverless/edge-style runtimes. When email is not configured the
 * call is a graceful no-op (logged) so the rest of the app keeps working.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.log(`[email] (not configured — skipped) to=${msg.to} subject="${msg.subject}"`);
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text ?? stripHtml(msg.html),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { sent: false, error: `Resend responded ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || "Failed to send email" };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function appUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
