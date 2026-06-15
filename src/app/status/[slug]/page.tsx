import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { getStatusBg, formatDate, formatResponseTime, cn } from "@/lib/utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Prefer a configured StatusPage; fall back to matching an org slug directly.
  const statusPage = await prisma.statusPage.findUnique({ where: { slug }, include: { org: true } });
  const org = statusPage?.org ?? (await prisma.org.findUnique({ where: { slug } }));
  if (!org || (statusPage && !statusPage.isPublic)) notFound();

  const title = statusPage?.title || `${org.name} Status`;
  const accent = statusPage?.accentColor || "#3b82f6";

  const since = new Date();
  since.setDate(since.getDate() - 90);
  since.setHours(0, 0, 0, 0);

  const monitors = await prisma.monitor.findMany({
    where: { orgId: org.id, isActive: true },
    include: {
      checkResults: { where: { timestamp: { gte: since } }, orderBy: { timestamp: "desc" }, select: { status: true, responseTime: true, timestamp: true } },
      incidents: { where: { status: "open" }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const monitorViews = monitors.map((m) => {
    const last = m.checkResults[0];
    const days: Array<{ date: Date; status: "up" | "down" | "partial" | "none" }> = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayChecks = m.checkResults.filter((c) => c.timestamp >= d && c.timestamp < next);
      if (dayChecks.length === 0) {
        days.push({ date: d, status: "none" });
      } else {
        const up = dayChecks.filter((c) => c.status === "up" || c.status === "degraded").length;
        const ratio = up / dayChecks.length;
        days.push({ date: d, status: ratio >= 0.95 ? "up" : ratio >= 0.5 ? "partial" : "down" });
      }
    }
    return { monitor: m, lastStatus: last?.status || "unknown", lastResponseTime: last?.responseTime, days };
  });

  const hasDown = monitorViews.some((m) => m.lastStatus === "down");
  const hasDegraded = monitorViews.some((m) => m.lastStatus === "degraded");
  const overallStatus = hasDown ? "Major Outage" : hasDegraded ? "Partial Outage" : "All Systems Operational";
  const overallColor = hasDown ? "text-red-500" : hasDegraded ? "text-amber-500" : "text-emerald-500";

  const openIncidents = monitorViews.flatMap((m) =>
    m.monitor.incidents.map((i) => ({ ...i, monitorName: m.monitor.name }))
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3">
            {statusPage?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={statusPage.logoUrl} alt={title} className="w-8 h-8 rounded" />
            ) : (
              <Activity className="w-8 h-8" style={{ color: accent }} />
            )}
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            {!hasDown && !hasDegraded ? (
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className={cn("w-16 h-16 mx-auto mb-4", overallColor)} />
            )}
            <h2 className={cn("text-2xl font-bold", overallColor)}>{overallStatus}</h2>
            <p className="text-muted-foreground mt-2">Last updated: {formatDate(now)}</p>
          </CardContent>
        </Card>

        {openIncidents.length > 0 && (
          <Card className="mb-8 border-amber-500/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Active Incidents</CardTitle></CardHeader>
            <CardContent>
              {openIncidents.map((incident) => (
                <div key={incident.id} className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg mb-3 last:mb-0">
                  <h3 className="font-semibold">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{incident.monitorName} · {formatDate(incident.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {monitorViews.length === 0 && <p className="text-muted-foreground text-center py-4">No monitors configured</p>}
            {monitorViews.map(({ monitor: m, lastStatus, lastResponseTime, days }) => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", getStatusBg(lastStatus as any))} />
                    <span className="font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant={lastStatus === "up" ? "default" : lastStatus === "down" ? "destructive" : "secondary"} className="capitalize">{lastStatus}</Badge>
                    {lastResponseTime != null && <span className="text-muted-foreground">{formatResponseTime(lastResponseTime)}</span>}
                  </div>
                </div>
                <UptimeTimeline data={days} />
              </div>
            ))}
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          Powered by <a href="/" className="text-primary hover:underline">WebsiteStatus</a>
        </footer>
      </main>
    </div>
  );
}
