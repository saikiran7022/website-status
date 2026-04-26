import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { Activity, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react";
import { formatUptime, formatResponseTime, getStatusBg, formatDate } from "@/lib/utils";

// Mock data - in production, fetch from database
const mockMonitors = [
  { id: "1", name: "Production API", url: "https://api.example.com", status: "up" as const, uptime: 99.98, responseTime: 142, type: "https" },
  { id: "2", name: "Main Website", url: "https://example.com", status: "up" as const, uptime: 99.95, responseTime: 230, type: "https" },
  { id: "3", name: "Staging Server", url: "https://staging.example.com", status: "down" as const, uptime: 95.2, responseTime: null, type: "https" },
  { id: "4", name: "CDN Endpoint", url: "https://cdn.example.com", status: "up" as const, uptime: 99.99, responseTime: 45, type: "https" },
  { id: "5", name: "Database TCP", url: "db.example.com:5432", status: "up" as const, uptime: 99.97, responseTime: 12, type: "tcp" },
  { id: "6", name: "DNS Resolution", url: "example.com", status: "degraded" as const, uptime: 98.5, responseTime: 350, type: "dns" },
];

const mockTimelineData = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 86400000),
  status: Math.random() > 0.05 ? ("up" as const) : ("down" as const),
}));

export default function DashboardPage() {
  const upCount = mockMonitors.filter((m) => m.status === "up").length;
  const downCount = mockMonitors.filter((m) => m.status === "down").length;
  const degradedCount = mockMonitors.filter((m) => m.status === "degraded").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor overview for your organization</p>
        </div>
        <Link href="/dashboard/monitors/new">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Add Monitor</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Monitors" value={mockMonitors.length} icon={Activity} change="+2 this week" changeType="positive" />
        <StatCard title="Monitors Up" value={upCount} icon={CheckCircle} change={`${formatUptime((upCount / mockMonitors.length) * 100)}`} changeType="positive" />
        <StatCard title="Monitors Down" value={downCount} icon={AlertCircle} change={downCount > 0 ? "Needs attention" : "All clear"} changeType={downCount > 0 ? "negative" : "positive"} />
        <StatCard title="Avg Response" value="156ms" icon={Clock} change="-12ms from last week" changeType="positive" />
      </div>

      {/* Monitor List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockMonitors.map((monitor) => (
              <Link key={monitor.id} href={`/dashboard/monitors/${monitor.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <span className={cn("w-3 h-3 rounded-full flex-shrink-0", getStatusBg(monitor.status))} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{monitor.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
                  </div>
                  <Badge variant={monitor.status === "up" ? "success" : monitor.status === "down" ? "destructive" : "warning"} className="hidden sm:inline-flex">
                    {monitor.status}
                  </Badge>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{formatUptime(monitor.uptime)}</p>
                    <p className="text-xs text-muted-foreground">{formatResponseTime(monitor.responseTime)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 90-day Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>90-Day Uptime Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <UptimeTimeline data={mockTimelineData} />
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Operational</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Outage</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Degraded</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { event: "Staging Server went down", monitor: "Staging Server", time: "2 minutes ago", type: "down" as const },
              { event: "CDN Endpoint recovered", monitor: "CDN Endpoint", time: "1 hour ago", type: "up" as const },
              { event: "DNS Resolution degraded", monitor: "DNS Resolution", time: "3 hours ago", type: "degraded" as const },
              { event: "SSL certificate expiring in 15 days", monitor: "Production API", time: "5 hours ago", type: "warning" as const },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                <span className={cn("w-2 h-2 rounded-full",
                  activity.type === "up" && "bg-emerald-500",
                  activity.type === "down" && "bg-red-500",
                  activity.type === "degraded" && "bg-amber-500",
                  activity.type === "warning" && "bg-blue-500"
                )} />
                <div className="flex-1">
                  <p className="text-sm">{activity.event}</p>
                  <p className="text-xs text-muted-foreground">{activity.monitor}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
