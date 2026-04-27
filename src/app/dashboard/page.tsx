import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { UptimeTimeline } from "@/components/charts/uptime-timeline";
import { Activity, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

function getStatusColor(status: string) {
  switch (status) {
    case 'up': return 'bg-emerald-500';
    case 'down': return 'bg-red-500';
    case 'degraded': return 'bg-amber-500';
    default: return 'bg-gray-400';
  }
}

function getBadgeVariant(status: string) {
  switch (status) {
    case 'up': return 'default' as const;
    case 'down': return 'destructive' as const;
    case 'degraded': return 'secondary' as const;
    default: return 'outline' as const;
  }
}

async function getDashboardData(orgId: string) {
  const monitors = await prisma.monitor.findMany({
    where: { orgId },
    include: {
      checkResults: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
      incidents: {
        where: { status: 'open' },
        take: 5,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const monitorsWithStats = await Promise.all(
    monitors.map(async (m) => {
      const checks = await prisma.checkResult.findMany({
        where: { monitorId: m.id, timestamp: { gte: since24h } },
        orderBy: { timestamp: 'desc' },
      });
      const upCount = checks.filter(c => c.status === 'up' || c.status === 'degraded').length;
      const avgResp = checks.length > 0 ? Math.round(checks.reduce((s, c) => s + c.responseTime, 0) / checks.length) : 0;
      const uptime = checks.length > 0 ? (upCount / checks.length) * 100 : 100;
      const lastCheck = checks[0];

      const timelineDays: { date: Date; status: 'up' | 'down' | 'partial' | 'none' }[] = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const dayChecks = await prisma.checkResult.findMany({
          where: { monitorId: m.id, timestamp: { gte: d, lt: next } },
        });
        if (dayChecks.length === 0) {
          timelineDays.push({ date: d, status: 'up' });
        } else {
          const dayUp = dayChecks.filter(c => c.status === 'up' || c.status === 'degraded' || c.status === 'partial').length;
          const ratio = dayUp / dayChecks.length;
          timelineDays.push({ date: d, status: ratio >= 0.95 ? 'up' : ratio >= 0.5 ? 'partial' : 'down' });
        }
      }

      return {
        ...m,
        uptime,
        avgResponseTime: avgResp,
        lastStatus: lastCheck?.status || 'unknown',
        lastCheckTime: lastCheck?.timestamp,
        timelineDays,
        incidents: m.incidents,
      };
    })
  );

  return monitorsWithStats;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const orgId = (user as any).orgId;
  let monitors: Awaited<ReturnType<typeof getDashboardData>> = [];
  try {
    monitors = await getDashboardData(orgId);
  } catch {
    // Empty state on first load
  }

  const upCount = monitors.filter((m) => m.lastStatus === "up").length;
  const downCount = monitors.filter((m) => m.lastStatus === "down").length;
  const degradedCount = monitors.filter((m) => m.lastStatus === "degraded").length;
  const avgResp = monitors.length > 0
    ? Math.round(monitors.reduce((sum, m) => sum + m.avgResponseTime, 0) / monitors.length)
    : 0;

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
        <StatCard title="Total Monitors" value={monitors.length} icon={Activity} change="Add more to get started" changeType="positive" />
        <StatCard title="Monitors Up" value={upCount} icon={CheckCircle} change={monitors.length > 0 ? `${Math.round((upCount / monitors.length) * 100)}% healthy` : "No monitors yet"} changeType="positive" />
        <StatCard title="Monitors Down" value={downCount} icon={AlertCircle} change={downCount > 0 ? "Needs attention" : "All clear"} changeType={downCount > 0 ? "negative" : "positive"} />
        <StatCard title="Avg Response" value={`${avgResp}ms`} icon={Clock} change="Across all monitors" changeType="positive" />
      </div>

      {/* Monitor List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          {monitors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No monitors configured yet.</p>
              <Link href="/dashboard/monitors/new">
                <Button variant="link" className="gap-2"><Plus className="w-4 h-4" /> Add your first monitor</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {monitors.map((monitor) => (
                <Link key={monitor.id} href={`/dashboard/monitors/${monitor.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(monitor.lastStatus)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{monitor.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
                    </div>
                    <Badge variant={getBadgeVariant(monitor.lastStatus)} className="hidden sm:inline-flex capitalize">
                      {monitor.lastStatus}
                    </Badge>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{monitor.uptime.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">{monitor.avgResponseTime}ms</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 90-day Timeline */}
      {monitors.length > 0 && monitors.some(m => m.timelineDays.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>90-Day Uptime Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monitors.map((m) => (
                <div key={m.id}>
                  <p className="text-sm font-medium mb-1">{m.name}</p>
                  <UptimeTimeline data={m.timelineDays} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Operational</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> Outage</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Degraded</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Incidents */}
      {monitors.some(m => m.incidents.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Open Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monitors.flatMap(m => m.incidents.map(i => ({ ...i, monitorName: m.name }))).slice(0, 10).map((incident, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="text-sm">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">{incident.monitorName}</p>
                  </div>
                  <Badge variant="destructive" className="capitalize">{incident.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
