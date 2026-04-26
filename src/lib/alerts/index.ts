import { prisma } from '@/lib/db';

export async function sendAlert(notification: { channel: string; message: string }) {
  console.log(`[${notification.channel}] ${notification.message}`);
  // In production: integrate with Slack, Discord, Email, etc.
}

export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
