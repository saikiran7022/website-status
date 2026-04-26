import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { Activity, CheckCircle, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { formatUptime, getStatusBg, formatDate, formatResponseTime } from "@/lib/utils";

export default async function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Mock data
  const statusPage = {
    title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Status`,
    accentColor: "#3b82f6",
    logo: null,
  };

  const monitors = [
    { id: "1", name: "API", url: "https://api.example.com", status: "up" as const, uptime: 99.98, responseTime: 142 },
    { id: "2", name: "Website", url: "https://example.com", status: "up" as const, uptime: 99.95, responseTime: 230 },
    { id: "3", name: "Database", url: "db.example.com:5432", status: "up" as const, uptime: 99.97, responseTime: 12 },
    { id: "4", name: "CDN", url: "https://cdn.example.com", status: "down" as const, uptime: 98.5, responseTime: 350 },
    { id: "5", name: "DNS", url: "example.com", status: "up" as const, uptime: 99.99, responseTime: 45 },
    { id: "6", name: "Email", url: "mail.example.com", status: "degraded" as const, uptime: 98.5, responseTime: 520 },
  ];

  const allUp = monitors.every((m) => m.status === "up");
  const hasDown = monitors.some((m) => m.status === "down");
  const hasDegraded = monitors.some((m) => m.status === "degraded");

  const overallStatus = hasDown ? "Major Outage" : hasDegraded ? "Partial Outage" : "All Systems Operational";
  const overallColor = hasDown ? "text-red-500" : hasDegraded ? "text-amber-500" : "text-emerald-500";

  const incidents = [
    { id: "1", title: "CDN experiencing high latency", status: "investigating", date: new Date(Date.now() - 3600000) },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ "--accent": statusPage.accentColor } as React.CSSProperties}>
      {/* Header */}
      <header className="border-b">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" style={{ color: statusPage.accentColor }} />
            <h1 className="text-2xl font-bold">{statusPage.title}</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
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
        {incidents.length > 0 && (
          <Card className="mb-8 border-amber-500/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Active Incidents</CardTitle></CardHeader>
            <CardContent>
              {incidents.map((incident) => (
                <div key={incident.id} className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r-lg">
                  <h3 className="font-semibold">{incident.title}</h3>
                  <Badge variant="warning" className="mt-2">{incident.status}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(incident.date)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Monitors */}
        <Card className="mb-8">
          <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {monitors.map((monitor) => {
              const timelineData = Array.from({ length: 90 }, (_, i) => ({
                date: new Date(Date.now() - (89 - i) * 86400000),
                status: Math.random() > (monitor.status === "up" ? 0.02 : 0.1) ? ("up" as const) : ("down" as const),
              }));

              return (
                <div key={monitor.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full", getStatusBg(monitor.status))} />
                      <span className="font-medium">{monitor.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant={monitor.status === "up" ? "success" : monitor.status === "down" ? "destructive" : "warning"}>{monitor.status}</Badge>
                      <span className="text-muted-foreground">{formatUptime(monitor.uptime)}</span>
                      <span className="text-muted-foreground">{formatResponseTime(monitor.responseTime)}</span>
                    </div>
                  </div>
                  <UptimeTimeline data={timelineData} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Past Incidents */}
        <Card>
          <CardHeader><CardTitle>Past Incidents</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Database maintenance completed", date: new Date(Date.now() - 86400000), duration: "2 hours" },
                { title: "API intermittent 502 errors", date: new Date(Date.now() - 86400000 * 3), duration: "45 minutes" },
              ].map((incident, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b last:border-0">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(incident.date)} · Duration: {incident.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground mt-12 pb-8">
          Powered by <a href="/" className="text-primary hover:underline">WebsiteStatus</a>
        </footer>
      </main>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
