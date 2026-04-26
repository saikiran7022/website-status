import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, ExternalLink, MoreVertical, Pause, Play, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatUptime, formatResponseTime, getStatusBg, formatDate } from "@/lib/utils";

// Mock data
const monitors = [
  { id: "1", name: "Production API", url: "https://api.example.com", status: "up" as const, uptime: 99.98, responseTime: 142, type: "https", enabled: true, interval: 60 },
  { id: "2", name: "Main Website", url: "https://example.com", status: "up" as const, uptime: 99.95, responseTime: 230, type: "https", enabled: true, interval: 300 },
  { id: "3", name: "Staging Server", url: "https://staging.example.com", status: "down" as const, uptime: 95.2, responseTime: null, type: "https", enabled: true, interval: 60 },
  { id: "4", name: "CDN Endpoint", url: "https://cdn.example.com", status: "up" as const, uptime: 99.99, responseTime: 45, type: "https", enabled: true, interval: 300 },
  { id: "5", name: "Database TCP", url: "db.example.com:5432", status: "up" as const, uptime: 99.97, responseTime: 12, type: "tcp", enabled: false, interval: 300 },
  { id: "6", name: "DNS Resolution", url: "example.com", status: "degraded" as const, uptime: 98.5, responseTime: 350, type: "dns", enabled: true, interval: 600 },
];

export default function MonitorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monitors</h1>
          <p className="text-muted-foreground">Manage your uptime monitors</p>
        </div>
        <Link href="/dashboard/monitors/new">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Add Monitor</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search monitors..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4">
        {monitors.map((monitor) => (
          <Card key={monitor.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className={cn("w-3 h-3 rounded-full flex-shrink-0", getStatusBg(monitor.status))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{monitor.name}</h3>
                    <Badge variant="outline" className="text-xs">{monitor.type}</Badge>
                    {!monitor.enabled && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Uptime</p>
                    <p className="font-semibold">{formatUptime(monitor.uptime)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Response</p>
                    <p className="font-semibold">{formatResponseTime(monitor.responseTime)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Interval</p>
                    <p className="font-semibold">{monitor.interval}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={monitor.enabled} />
                  <Link href={`/dashboard/monitors/${monitor.id}`}>
                    <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Pause className="w-4 h-4 mr-2" />Pause</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
