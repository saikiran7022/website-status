"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Key, Plus, Trash2, Copy, Loader2, Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    setSaving(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreated(data.key);
        setName("");
        load();
      } else {
        toast.error(data.error || "Failed to create key");
      }
    } finally {
      setSaving(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this API key? Applications using it will stop working.")) return;
    const res = await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("API key revoked");
      setKeys((k) => k.filter((x) => x.id !== id));
    } else {
      toast.error("Failed to revoke key");
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function closeDialog() {
    setOpen(false);
    setCreated(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys for programmatic access</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{created ? "Copy your API key" : "Create API Key"}</DialogTitle></DialogHeader>
            {created ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This key is shown only once. Store it somewhere safe.
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={created} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copy(created)}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Key name</Label>
                  <Input placeholder="Production server" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}
            <DialogFooter>
              {created ? (
                <Button onClick={closeDialog}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={create} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Using the API</CardTitle>
          <CardDescription>Authenticate with the <code className="text-xs">Authorization</code> header</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <pre className="text-xs font-mono overflow-x-auto">
{`curl -H "Authorization: Bearer ws_your_api_key" \\
  ${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/v1/monitors`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your Keys</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No API keys yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{k.prefix}••••••••</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Created {formatDate(k.createdAt)}</p>
                    <p>{k.lastUsedAt ? `Last used ${formatDate(k.lastUsedAt)}` : "Never used"}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => revoke(k.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
