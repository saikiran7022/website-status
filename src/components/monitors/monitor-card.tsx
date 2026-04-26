import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusColor, getStatusBg, formatUptime, formatResponseTime, formatDate } from "@/lib/utils";
import { ExternalLink, MoreVertical, Pause, Play, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MonitorCardProps {
  id: string;
  name: string;
  url: string;
  type: string;
  status: "up" | "down" | "degraded" | "paused";
  uptimePercent: number;
  responseTime: number | null;
  lastChecked: Date | null;
  enabled: boolean;
}

export function MonitorCard({ id, name, url, type, status, uptimePercent, responseTime, lastChecked, enabled }: MonitorCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("w-2.5 h-2.5 rounded-full", getStatusBg(status))} />
              <h3 className="font-semibold truncate">{name}</h3>
              <Badge variant={status === "up" ? "success" : status === "down" ? "destructive" : status === "degraded" ? "warning" : "secondary"} className="text-[10px]">
                {status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{url}</span>
              <Badge variant="outline" className="text-[10px]">{type}</Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><ExternalLink className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
              <DropdownMenuItem>{enabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}{enabled ? "Pause" : "Resume"}</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="font-semibold">{formatUptime(uptimePercent)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Response</p>
            <p className="font-semibold">{formatResponseTime(responseTime)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Check</p>
            <p className="text-sm font-medium">{lastChecked ? formatDate(lastChecked) : "Never"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
