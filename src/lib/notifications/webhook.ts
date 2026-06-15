/**
 * Outbound webhook delivery. POSTs a JSON payload to a user-configured URL with
 * a short timeout so a slow endpoint cannot stall the check worker.
 */
export interface WebhookResult {
  sent: boolean;
  error?: string;
}

export async function sendWebhook(url: string, payload: unknown): Promise<WebhookResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "WebsiteStatus/1.0" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { sent: false, error: `Webhook responded ${res.status}` };
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || "Webhook request failed" };
  }
}
