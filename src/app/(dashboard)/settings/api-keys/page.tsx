"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Key } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const apiKeys = [
  { id: "1", name: "Production Key", key: "ws_a1b2c3d4e5f6...", createdAt: new Date(Date.now() - 86400000 * 30), expiresAt: null },
  { id: "2", name: "CI/CD Pipeline", key: "ws_x9y8z7w6v5u4...", createdAt: new Date(Date.now() - 86400000 * 7), expiresAt: new Date(Date.now() + 86400000 * 90) },
];

export default function ApiKeysPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys for programmatic access</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Create Key</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create API Key</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Key Name</Label><Input id="name" placeholder="e.g., Production API" /></div>
            </div>
            <DialogFooter><Button onClick={() => { setOpen(false); toast.success("API key created"); }}>Create Key</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {apiKeys.map((key, i) => (
            <div key={key.id} className={cn("flex items-center gap-4 p-4", i !== apiKeys.length - 1 && "border-b")}>
              <Key className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{key.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <code className="bg-muted px-2 py-0.5 rounded text-xs">{key.key}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(key.key); toast.success("Copied to clipboard"); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Created {formatDate(key.createdAt)}</p>
                {key.expiresAt && <p>Expires {formatDate(key.expiresAt)}</p>}
              </div>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
