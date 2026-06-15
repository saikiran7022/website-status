import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertChannels } from "@/components/alerts/alert-channels";
import { Bell, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgId = user.orgId;

  const [openIncidents, recentFailures] = orgId
    ? await Promise.all([
        prisma.incident.findMany({
          where: { status: "open", monitor: { orgId } },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { monitor: { select: { name: true } } },
        }),
        prisma.checkResult.findMany({
          where: { status: "down", monitor: { orgId } },
          orderBy: { timestamp: "desc" },
          take: 20,
          include: { monitor: { select: { name: true } } },
        }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-muted-foreground">Notification channels, open incidents, and recent failures</p>
      </div>

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="incidents">Open Incidents</TabsTrigger>
          <TabsTrigger value="failures">Recent Failures</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <AlertChannels />
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardContent className="p-4 space-y-4">
              {openIncidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><p>No open incidents 🎉</p></div>
              ) : (
                openIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-sm text-muted-foreground">{incident.monitor?.name}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(incident.createdAt)}</span>
                    <Badge variant="destructive">{incident.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card>
            <CardContent className="p-4 space-y-4">
              {recentFailures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><p>No recent failures</p></div>
              ) : (
                recentFailures.map((check) => (
                  <div key={check.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <Bell className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">{check.monitor?.name}</p>
                      <p className="text-sm text-muted-foreground">{check.error || "Check failed"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">{formatDate(check.timestamp)}</p>
                      <p>{check.responseTime}ms</p>
                    </div>
                    <Badge variant="destructive">Down</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
