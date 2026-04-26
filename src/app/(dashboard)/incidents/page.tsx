"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Clock, MessageSquare } from "lucide-react";
import { formatDate, formatDuration, getIncidentStatusColor, getIncidentSeverityColor } from "@/lib/utils";
import { IncidentStatus, IncidentSeverity } from "@/types";

const incidents = [
  {
    id: "1",
    title: "API Connection Timeout",
    monitor: "Production API",
    status: "investigating" as IncidentStatus,
    severity: "critical" as IncidentSeverity,
    startedAt: new Date(Date.now() - 3600000),
    resolvedAt: null,
    updates: [
      { id: "1", message: "Investigating connection timeouts to the API server", createdAt: new Date(Date.now() - 3600000) },
    ],
  },
  {
    id: "2",
    title: "High Error Rate",
    monitor: "Main Website",
    status: "identified" as IncidentStatus,
    severity: "major" as IncidentSeverity,
    startedAt: new Date(Date.now() - 86400000 * 2),
    resolvedAt: null,
    updates: [
      { id: "1", message: "Identified root cause: database connection pool exhaustion", createdAt: new Date(Date.now() - 82800000) },
      { id: "2", message: "Investigating high error rates reported by users", createdAt: new Date(Date.now() - 86400000 * 2) },
    ],
  },
  {
    id: "3",
    title: "SSL Certificate Renewed",
    monitor: "CDN Endpoint",
    status: "resolved" as IncidentStatus,
    severity: "minor" as IncidentSeverity,
    startedAt: new Date(Date.now() - 86400000 * 5),
    resolvedAt: new Date(Date.now() - 86400000 * 5 + 7200000),
    updates: [
      { id: "1", message: "SSL certificate successfully renewed", createdAt: new Date(Date.now() - 86400000 * 5 + 7200000) },
    ],
  },
];

export default function IncidentsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-muted-foreground">Track and manage service disruptions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create Incident</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Incident</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" placeholder="Brief description" /></div>
              <div className="space-y-2"><Label htmlFor="severity">Severity</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger><SelectContent>
                  <SelectItem value="critical">Critical</SelectItem><SelectItem value="major">Major</SelectItem><SelectItem value="minor">Minor</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent></Select>
              </div>
              <div className="space-y-2"><Label htmlFor="update">Initial Update</Label><Textarea id="update" placeholder="What happened?" /></div>
            </div>
            <DialogFooter><Button onClick={() => setOpen(false)}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {incidents.map((incident) => (
          <Card key={incident.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <AlertTriangle className={cn("w-5 h-5", incident.status === "resolved" ? "text-emerald-500" : "text-amber-500")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{incident.title}</h3>
                    <Badge className={getIncidentSeverityColor(incident.severity)}>{incident.severity}</Badge>
                    <Badge className={getIncidentStatusColor(incident.status)}>{incident.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {incident.monitor} · Started {formatDate(incident.startedAt)}
                    {incident.resolvedAt && ` · Resolved in ${formatDuration(incident.resolvedAt.getTime() - incident.startedAt.getTime())}`}
                  </p>
                  <div className="mt-3 space-y-2">
                    {incident.updates.map((update) => (
                      <div key={update.id} className="flex gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p>{update.message}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(update.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
