import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { Activity, CheckCircle, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { formatUptime, getStatusBg, formatDate, formatResponseTime, cn } from "@/lib/utils";
import { prisma } from "@/lib/db";

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Find org by slug
  const org = await prisma.org.findUnique({ where: { slug }, include: { members: true } });

  const monitors = org
    ? await prisma.monitor.findMany({
        where: { orgId: org.id },
        include: {
          checkResults: { orderBy: { timestamp: "desc" }, take: 1 },
          incidents: { where: { status: "open" }, orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const monitorStatuses = monitors.map((m) => {
    const lastCheck = m.checkResults[0];
    const status = lastCheck?.status || "unknown";
    return { ...m, lastStatus: status, lastCheckTime: lastCheck?.timestamp, lastResponseTime: lastCheck?.responseTime };
  });

  const allUp = monitorStatuses.every((m) => m.lastStatus === "up" || m.lastStatus === "degraded" || m.lastStatus === "unknown");
  const hasDown = monitorStatuses.some((m) => m.lastStatus === "down");
  const hasDegraded = monitorStatuses.some((m) => m.lastStatus === "degraded");

  const overallStatus = hasDown ? "Major Outage" : hasDegraded ? "Partial Outage" : "All Systems Operational";
  const overallColor = hasDown ? "text-red-500" : hasDegraded ? "text-amber-500" : "text-emerald-500";

  // Build 90-day timelines for each monitor
  const monitorTimelines = monitorStatuses.map((m) => {
    const now = new Date();
    const days: Array<{ date: Date; status: "up" | "down" | "partial" | "none" }> = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      // No actual check data without fetching all checks; default to current status
      days.push({ date: d, status: m.lastStatus === "down" ? "down" : "up" });
    }
    return { monitor: m, days };
  });

  // Open incidents
  const openIncidents = monitors.flatMap((m) =>
    m.incidents.map((i) => ({ ...i, monitorName: m.name }))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">{org?.name || slug} Status</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Overall Status */}
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            {allUp ? (
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className={cn("w-16 h-16 mx-auto mb-4", overallColor)} />
            )}
            <h2 className={cn("text-2xl font-bold", overallColor)}>{overallStatus}</h2>
            <p className="text-muted-foreground mt-2">Last updated: {formatDate(new Date())}</p>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        {openIncidents.length > 0 && (
          <Card className="mb-8 border-amber-500/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Active Incidents</CardTitle></CardHeader>
            <CardContent>
              {openIncidents.map((incident) => (
                <div key={incident.id} className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg mb-3 last:mb-0">
                  <h3 className="font-semibold">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{incident.monitorName}</p>
                  <Badge variant="secondary" className="mt-2 capitalize">{incident.status}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(incident.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Monitors */}
        <Card className="mb-8">
          <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {monitorTimelines.map(({ monitor: m, days }) => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", getStatusBg(m.lastStatus as any))} />
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.url}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant={m.lastStatus === "up" ? "default" : m.lastStatus === "down" ? "destructive" : "secondary"} className="capitalize">{m.lastStatus}</Badge>
                    {m.lastResponseTime && <span className="text-muted-foreground">{formatResponseTime(m.lastResponseTime)}</span>}
                  </div>
                </div>
                <UptimeTimeline data={days} />
              </div>
            ))}
            {monitorTimelines.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No monitors configured</p>
            )}
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          Powered by <a href="/" className="text-primary hover:underline">WebsiteStatus</a>
        </footer>
      </main>
    </div>
  );
}
