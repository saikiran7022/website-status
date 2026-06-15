/**
 * Subscription plan definitions and limits.
 * Limits are enforced at monitor-creation time and surfaced on the billing page.
 */
export type Plan = "free" | "pro" | "enterprise";

export interface PlanConfig {
  id: Plan;
  name: string;
  price: number; // USD per month
  maxMonitors: number | null; // null = unlimited
  minInterval: number; // smallest allowed check interval, in minutes
  maxMembers: number | null;
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    maxMonitors: 10,
    minInterval: 5,
    maxMembers: 3,
    features: [
      "10 monitors",
      "5-minute check intervals",
      "Email & webhook alerts",
      "Public status page",
      "90-day data retention",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 29,
    maxMonitors: 50,
    minInterval: 1,
    maxMembers: 10,
    features: [
      "50 monitors",
      "1-minute check intervals",
      "Email & webhook alerts",
      "Custom branded status pages",
      "REST API access",
      "Team collaboration (up to 10 members)",
      "Priority email support",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    maxMonitors: null,
    minInterval: 1,
    maxMembers: null,
    features: [
      "Unlimited monitors",
      "1-minute check intervals",
      "All alert channels",
      "Unlimited team members",
      "SSO & audit logs",
      "Dedicated support",
    ],
  },
};

export function getPlan(plan: string | null | undefined): PlanConfig {
  return PLANS[(plan as Plan) ?? "free"] ?? PLANS.free;
}
