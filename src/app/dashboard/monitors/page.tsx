"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Search, ExternalLink, MoreVertical, Pause, Play, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Monitor {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  interval: number;
  _count: { checkResults: number; incidents: number };
  checkResults?: Array<{ status: string; responseTime: number }>;
}

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${seconds / 60}m`;
}

export default function MonitorsPage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMonitors();
  }, []);

  async function fetchMonitors() {
    try {
      const res = await fetch("/api/monitors");
      if (res.ok) {
        const data = await res.json();
        setMonitors(data);
      }
    } catch {
      toast.error("Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }

  async function toggleMonitor(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/monitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        toast.success(`Monitor ${isActive ? "activated" : "paused"}`);
        fetchMonitors();
      }
    } catch {
      toast.error("Failed to update monitor");
    }
  }

  async function deleteMonitor(id: string, name: string) {
    if (!confirm(`Delete monitor "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/monitors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Monitor deleted");
        fetchMonitors();
      } else {
        toast.error("Failed to delete monitor");
      }
    } catch {
      toast.error("Failed to delete monitor");
    }
  }

  const filtered = monitors.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.url.toLowerCase().includes(search.toLowerCase())
  );

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
          <Input placeholder="Search monitors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{search ? "No monitors match your search" : "No monitors yet. Add one to get started."}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((monitor) => {
            const lastStatus = monitor.checkResults?.[0]?.status || "unknown";
            return (
              <Card key={monitor.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <span className={cn("w-3 h-3 rounded-full flex-shrink-0", monitor.isActive ? (lastStatus === "up" ? "bg-emerald-500" : lastStatus === "down" ? "bg-red-500" : "bg-amber-500") : "bg-gray-400")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{monitor.name}</h3>
                        {!monitor.isActive && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{monitor.url}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Checks</p>
                        <p className="font-semibold">{monitor._count.checkResults}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Incidents</p>
                        <p className="font-semibold">{monitor._count.incidents}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Interval</p>
                        <p className="font-semibold">{formatInterval(monitor.interval)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={monitor.isActive} onCheckedChange={(v) => toggleMonitor(monitor.id, v)} />
                      <Link href={`/dashboard/monitors/${monitor.id}`}>
                        <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleMonitor(monitor.id, !monitor.isActive)}>
                            {monitor.isActive ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteMonitor(monitor.id, monitor.name)}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
