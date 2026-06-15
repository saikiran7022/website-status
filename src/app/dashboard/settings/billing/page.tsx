import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PLANS, getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgId = user.orgId!;

  const [monitorCount, memberCount] = await Promise.all([
    prisma.monitor.count({ where: { orgId } }),
    prisma.user.count({ where: { orgId } }),
  ]);

  const current = getPlan(user.org?.plan);
  const monitorPct =
    current.maxMonitors == null ? 0 : Math.min((monitorCount / current.maxMonitors) * 100, 100);

  const upgrades = Object.values(PLANS).filter((p) => p.id !== current.id && p.price >= current.price);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and usage</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are currently on the {current.name} plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{current.name}</span>
                <Badge>Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">${current.price}/month</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Monitors</span>
                <span>{monitorCount} / {current.maxMonitors ?? "∞"}</span>
              </div>
              {current.maxMonitors != null && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${monitorPct}%` }} />
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span>Team Members</span>
              <span>{memberCount} / {current.maxMembers ?? "∞"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {upgrades.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <CardTitle>Upgrade to {plan.name}</CardTitle>
            <CardDescription>${plan.price}/month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
