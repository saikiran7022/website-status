import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseTimeChart } from "@/components/charts/response-time-chart";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { ArrowLeft, ExternalLink, Bell, AlertTriangle, Clock } from "lucide-react";
import { formatUptime, formatResponseTime, getStatusBg, formatDate, formatDuration, cn } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getMonitorData(id: string, orgId: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id, orgId },
    include: {
      checkResults: { orderBy: { timestamp: "desc" }, take: 100 },
      incidents: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!monitor) return null;

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const since90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [checks30, checks60, checks90] = await Promise.all([
    prisma.checkResult.findMany({ where: { monitorId: id, timestamp: { gte: since30 } } }),
    prisma.checkResult.findMany({ where: { monitorId: id, timestamp: { gte: since60 } } }),
    prisma.checkResult.findMany({ where: { monitorId: id, timestamp: { gte: since90 } } }),
  ]);

  const calcUptime = (checks: any[]) => {
    if (checks.length === 0) return 100;
    const up = checks.filter((c) => c.status === "up" || c.status === "degraded").length;
    return (up / checks.length) * 100;
  };

  const avgResp = (checks: any[]) =>
    checks.length > 0 ? Math.round(checks.reduce((s: number, c: any) => s + c.responseTime, 0) / checks.length) : 0;

  // Build 90-day timeline
  const timelineDays: Array<{ date: Date; status: "up" | "down" | "partial" | "none" }> = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayChecks = checks90.filter(
      (c: any) => new Date(c.timestamp) >= d && new Date(c.timestamp) < next
    );
    if (dayChecks.length === 0) {
      timelineDays.push({ date: d, status: "none" });
    } else {
      const dayUp = dayChecks.filter((c: any) => c.status === "up" || c.status === "degraded").length;
      const ratio = dayUp / dayChecks.length;
      timelineDays.push({ date: d, status: ratio >= 0.95 ? "up" : ratio >= 0.5 ? "partial" : "down" });
    }
  }

  // Build response time chart data
  const responseTimeData = timelineDays.map((day) => {
    const dayChecksForAvg = checks90.filter(
      (c: any) => {
        const d2 = new Date(c.timestamp);
        return d2 >= day.date && d2 < new Date(day.date.getTime() + 86400000);
      }
    );
    const p50 = dayChecksForAvg.length > 0
      ? Math.round(
        dayChecksForAvg
          .sort((a: any, b: any) => a.responseTime - b.responseTime)
          [Math.floor(dayChecksForAvg.length * 0.5)].responseTime
      )
      : 0;
    const p95 = dayChecksForAvg.length > 0
      ? Math.round(
        dayChecksForAvg
          .sort((a: any, b: any) => a.responseTime - b.responseTime)
          [Math.floor(dayChecksForAvg.length * 0.95)].responseTime
      )
      : 0;
    const p99 = dayChecksForAvg.length > 0
      ? Math.round(
        dayChecksForAvg
          .sort((a: any, b: any) => a.responseTime - b.responseTime)
          [Math.floor(dayChecksForAvg.length * 0.99)].responseTime
      )
      : 0;
    const actual = dayChecksForAvg.length > 0 ? avgResp(dayChecksForAvg) : 0;
    return { timestamp: day.date, p50, p95, p99, actual };
  });

  const lastCheck = monitor.checkResults[0];

  return {
    monitor,
    uptime30: calcUptime(checks30),
    uptime60: calcUptime(checks60),
    uptime90: calcUptime(checks90),
    avgResponseTime: avgResp(checks30),
    lastStatus: lastCheck?.status || "unknown",
    lastCheckTime: lastCheck?.timestamp,
    timelineDays,
    responseTimeData: responseTimeData.filter((d) => d.actual > 0),
    recentChecks: monitor.checkResults.slice(0, 20),
  };
}

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <div className="p-6">Please sign in</div>;

  const orgId = (user as any).orgId;
  const { id } = await params;
  const data = await getMonitorData(id, orgId);
  if (!data) notFound();

  const { monitor, uptime30, uptime60, uptime90, avgResponseTime, lastStatus, lastCheckTime, timelineDays, responseTimeData, recentChecks } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/monitors">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", getStatusBg(lastStatus as any))} />
            <h1 className="text-2xl font-bold">{monitor.name}</h1>
            <Badge variant={lastStatus === "up" ? "default" : "destructive"} className="capitalize">{lastStatus}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <a href={monitor.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              {monitor.url} <ExternalLink className="w-3 h-3" />
            </a>
            <Badge variant="outline">Every {monitor.interval}m</Badge>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">30-Day Uptime</p><p className="text-2xl font-bold text-emerald-500">{formatUptime(uptime30)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">60-Day Uptime</p><p className="text-2xl font-bold text-emerald-500">{formatUptime(uptime60)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">90-Day Uptime</p><p className="text-2xl font-bold text-emerald-500">{formatUptime(uptime90)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Avg Response</p><p className="text-2xl font-bold">{formatResponseTime(avgResponseTime)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="response">Response Time</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="checks">Recent Checks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>90-Day Uptime Timeline</CardTitle></CardHeader>
            <CardContent>
              <UptimeTimeline data={timelineDays} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response">
          <Card>
            <CardHeader><CardTitle>Response Time (90 Days)</CardTitle></CardHeader>
            <CardContent>
              {responseTimeData.length > 0 ? (
                <ResponseTimeChart data={responseTimeData} />
              ) : (
                <p className="text-muted-foreground text-center py-8">No response time data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          {monitor.incidents.length > 0 ? (
            monitor.incidents.map((incident: any) => (
              <Card key={incident.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <Badge variant={incident.severity === "critical" ? "destructive" : "secondary"} className="text-xs capitalize">{incident.severity}</Badge>
                        {incident.resolvedAt && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Duration: {formatDuration(new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime())}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(incident.createdAt)}{incident.resolvedAt ? ` — ${formatDate(incident.resolvedAt)}` : ""}</p>
                    </div>
                    <Badge variant={incident.status === "open" ? "destructive" : "default"} className="capitalize">{incident.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No incidents recorded</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader><CardTitle>Recent Check Results</CardTitle></CardHeader>
            <CardContent>
              {recentChecks.length > 0 ? (
                <div className="space-y-2">
                  {recentChecks.map((check: any) => (
                    <div key={check.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className={cn("w-2 h-2 rounded-full", check.status === "up" ? "bg-emerald-500" : check.status === "degraded" ? "bg-amber-500" : "bg-red-500")} />
                      <span className="text-sm font-mono w-16">{check.statusCode || "-"}</span>
                      <span className="text-sm flex-1">{formatDate(check.timestamp)}</span>
                      <span className="text-sm text-muted-foreground">{formatResponseTime(check.responseTime)}</span>
                      {check.error && <span className="text-xs text-red-500 max-w-[200px] truncate">{check.error}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No check results yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
