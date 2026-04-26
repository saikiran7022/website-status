import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseTimeChart } from "@/components/charts/response-time-chart";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { ArrowLeft, ExternalLink, RefreshCw, Bell, AlertTriangle, Clock } from "lucide-react";
import { formatUptime, formatResponseTime, getStatusBg, formatDate, formatDuration } from "@/lib/utils";

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Mock data - in production, fetch from DB
  const monitor = {
    id,
    name: "Production API",
    url: "https://api.example.com",
    type: "https",
    method: "GET",
    status: "up" as const,
    uptime30: 99.98,
    uptime60: 99.95,
    uptime90: 99.92,
    responseTime: 142,
    lastChecked: new Date(Date.now() - 60000),
    enabled: true,
    interval: 60,
  };

  const timelineData = Array.from({ length: 90 }, (_, i) => ({
    date: new Date(Date.now() - (89 - i) * 86400000),
    status: Math.random() > 0.03 ? ("up" as const) : ("down" as const),
  }));

  const responseTimeData = Array.from({ length: 90 }, (_, i) => ({
    timestamp: new Date(Date.now() - (89 - i) * 86400000),
    p50: 100 + Math.random() * 50,
    p95: 200 + Math.random() * 100,
    p99: 300 + Math.random() * 200,
    actual: 100 + Math.random() * 150,
  }));

  const incidents = [
    { id: "1", title: "Connection timeout", status: "resolved" as const, severity: "major" as const, startedAt: new Date(Date.now() - 86400000 * 2), resolvedAt: new Date(Date.now() - 86400000 * 2 + 3600000) },
    { id: "2", title: "502 Bad Gateway", status: "resolved" as const, severity: "critical" as const, startedAt: new Date(Date.now() - 86400000 * 5), resolvedAt: new Date(Date.now() - 86400000 * 5 + 7200000) },
  ];

  const recentChecks = Array.from({ length: 10 }, (_, i) => ({
    id: `check-${i}`,
    timestamp: new Date(Date.now() - i * 60000),
    responseTime: 100 + Math.random() * 200,
    statusCode: 200,
    success: Math.random() > 0.05,
    attempt: 1,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/monitors">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", getStatusBg(monitor.status))} />
            <h1 className="text-2xl font-bold">{monitor.name}</h1>
            <Badge variant={monitor.status === "up" ? "success" : "destructive"}>{monitor.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <a href={monitor.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
              {monitor.url} <ExternalLink className="w-3 h-3" />
            </a>
            <Badge variant="outline">{monitor.type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2"><RefreshCw className="w-4 h-4" />Test Now</Button>
          <Button variant="outline" size="sm" className="gap-2"><Bell className="w-4 h-4" />Alerts</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">30-Day Uptime</p><p className="text-2xl font-bold text-emerald-500">{formatUptime(monitor.uptime30)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">60-Day Uptime</p><p className="text-2xl font-bold text-emerald-500">{formatUptime(monitor.uptime60)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">90-Day Uptime</p><p className="text-2xl font-bold text-emerald-500">{formatUptime(monitor.uptime90)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Avg Response</p><p className="text-2xl font-bold">{formatResponseTime(monitor.responseTime)}</p></CardContent></Card>
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
              <UptimeTimeline data={timelineData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="response">
          <Card>
            <CardHeader><CardTitle>Response Time (90 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponseTimeChart data={responseTimeData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{incident.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <Badge variant={incident.severity === "critical" ? "destructive" : "warning"} className="text-xs">{incident.severity}</Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Duration: {formatDuration((incident.resolvedAt!.getTime() - incident.startedAt.getTime()))}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(incident.startedAt)} - {formatDate(incident.resolvedAt)}</p>
                  </div>
                  <Badge variant="success" className="text-xs">{incident.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="checks">
          <Card>
            <CardHeader><CardTitle>Recent Check Results</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentChecks.map((check) => (
                  <div key={check.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className={cn("w-2 h-2 rounded-full", check.success ? "bg-emerald-500" : "bg-red-500")} />
                    <span className="text-sm font-mono w-16">{check.statusCode || "-"}</span>
                    <span className="text-sm flex-1">{formatDate(check.timestamp)}</span>
                    <span className="text-sm text-muted-foreground">{formatResponseTime(Math.round(check.responseTime))}</span>
                    <span className="text-xs text-muted-foreground">Attempt {check.attempt}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
