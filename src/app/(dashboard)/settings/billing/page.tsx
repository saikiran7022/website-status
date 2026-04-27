import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgId = (user as any).orgId;
  const monitorCount = await prisma.monitor.count({ where: { orgId } });
  const memberCount = await prisma.user.count({ where: { orgId } });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You are currently on the Free plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Free</span>
                <Badge>Active</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">10 monitors · 5-min intervals · Email alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Monitors</span><span>{monitorCount} / 10</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min((monitorCount / 10) * 100, 100)}%` }} /></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Team Members</span><span>{memberCount}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Upgrade to Pro</CardTitle><CardDescription>Unlock powerful features for growing teams</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "50 monitors",
              "1-minute check intervals",
              "All alert channels (Slack, Discord, Webhook)",
              "Custom branded status pages",
              "90-day data retention",
              "REST API access",
              "Team collaboration (up to 10 members)",
              "Priority email support",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                {feature}
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 border rounded-lg">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
