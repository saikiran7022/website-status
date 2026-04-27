import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, Webhook, Plus, AlertTriangle, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgId = (user as any).orgId;

  const monitors = await prisma.monitor.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  const openIncidents = await prisma.incident.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { monitor: { select: { name: true } } },
  });

  const recentChecks = await prisma.checkResult.findMany({
    where: { status: "down" },
    orderBy: { timestamp: "desc" },
    take: 20,
    include: { monitor: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Monitor health and recent failures</p>
        </div>
      </div>

      <Tabs defaultValue="monitors">
        <TabsList>
          <TabsTrigger value="monitors">Monitors</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="failures">Recent Failures</TabsTrigger>
        </TabsList>

        <TabsContent value="monitors" className="space-y-4">
          {monitors.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">{m.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Paused"}</Badge>
                    <span className="text-sm text-muted-foreground">Every {m.interval}m</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {monitors.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No monitors configured yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {openIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-sm text-muted-foreground">{incident.monitor?.name || "Unknown monitor"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{formatDate(incident.createdAt)}</p>
                    </div>
                    <Badge variant="destructive">{incident.status}</Badge>
                  </div>
                ))}
                {openIncidents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No open incidents</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {recentChecks.map((check) => (
                  <div key={check.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">{check.monitor?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{check.error || "Check failed"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{formatDate(check.timestamp)}</p>
                      <p>{check.responseTime}ms</p>
                    </div>
                    <Badge variant="destructive">Down</Badge>
                  </div>
                ))}
                {recentChecks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recent failures</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
