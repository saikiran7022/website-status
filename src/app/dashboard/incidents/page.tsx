"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Clock, MessageSquare, Loader2 } from "lucide-react";
import { formatDate, formatDuration, getIncidentStatusColor, getIncidentSeverityColor, cn } from "@/lib/utils";
import { IncidentStatus, IncidentSeverity } from "@/types";
import { toast } from "sonner";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  description: string | null;
  createdAt: string;
  resolvedAt: string | null;
  monitor: { name: string; url: string };
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("major");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    try {
      const res = await fetch("/api/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch {
      toast.error("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }

  async function createIncident() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, severity, description }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Incident created");
        setOpen(false);
        setTitle("");
        setDescription("");
        fetchIncidents();
      } else {
        toast.error(data.error || "Failed to create incident");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function resolveIncident(id: string) {
    try {
      const res = await fetch("/api/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      if (res.ok) {
        toast.success("Incident resolved");
        fetchIncidents();
      }
    } catch {
      toast.error("Failed to resolve incident");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" placeholder="Brief description" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="severity">Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="What happened?" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={createIncident}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No incidents yet</p>
        </div>
      ) : (
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
                      <Badge className={incident.status === "resolved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}>{incident.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {incident.monitor?.name || "Unknown"} · Started {formatDate(incident.createdAt)}
                      {incident.resolvedAt && ` · Resolved in ${formatDuration(new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime())}`}
                    </p>
                    {incident.description && (
                      <p className="text-sm mt-2">{incident.description}</p>
                    )}
                  </div>
                  {incident.status !== "resolved" && (
                    <Button variant="outline" size="sm" onClick={() => resolveIncident(incident.id)}>Resolve</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
