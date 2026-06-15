"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Mail, Webhook, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string;
  name: string;
  type: "email" | "webhook";
  target: string;
  enabled: boolean;
}

export function AlertChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<"email" | "webhook">("email");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/alert-channels");
      if (res.ok) setChannels(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!target.trim()) {
      toast.error(type === "email" ? "Enter an email address" : "Enter a webhook URL");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/alert-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, target }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Alert channel added");
        setOpen(false);
        setName("");
        setTarget("");
        load();
      } else {
        toast.error(data.error || "Failed to add channel");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    const res = await fetch("/api/alert-channels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    if (res.ok) {
      setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, enabled } : c)));
    } else {
      toast.error("Failed to update channel");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this alert channel?")) return;
    const res = await fetch(`/api/alert-channels?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Channel removed");
      setChannels((cs) => cs.filter((c) => c.id !== id));
    } else {
      toast.error("Failed to remove channel");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Notify these destinations when a monitor goes down or recovers.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Channel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Alert Channel</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "email" | "webhook")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name (optional)</Label>
                <Input placeholder="On-call team" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{type === "email" ? "Email address" : "Webhook URL"}</Label>
                <Input
                  placeholder={type === "email" ? "alerts@example.com" : "https://hooks.example.com/..."}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : channels.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No alert channels yet. Add one to get notified about outages.</p>
        </div>
      ) : (
        channels.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-center gap-3">
              {c.type === "email" ? <Mail className="w-5 h-5 text-muted-foreground" /> : <Webhook className="w-5 h-5 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground truncate">{c.target}</p>
              </div>
              <Badge variant={c.enabled ? "default" : "secondary"}>{c.enabled ? "Enabled" : "Disabled"}</Badge>
              <Switch checked={c.enabled} onCheckedChange={(v) => toggle(c.id, v)} />
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
