"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Palette, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface StatusPage {
  slug: string;
  title: string;
  description: string | null;
  logoUrl: string | null;
  accentColor: string;
  isPublic: boolean;
}

export default function StatusPageEditor() {
  const router = useRouter();
  const [page, setPage] = useState<StatusPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/status-page")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPage(data))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof StatusPage>(key: K, value: StatusPage[K]) {
    setPage((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch("/api/status-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(page),
      });
      const data = await res.json();
      if (res.ok) {
        setPage(data);
        toast.success("Status page saved");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!page) {
    return <div className="p-6 text-muted-foreground">Status page not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/status-pages"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Edit Status Page</h1>
          <p className="text-muted-foreground">Configure your public status page</p>
        </div>
        <Link href={`/status/${page.slug}`} target="_blank">
          <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="w-4 h-4" /> Preview</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Page Title</Label><Input value={page.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={page.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Optional subtitle shown on the page" /></div>
          <div className="space-y-2">
            <Label>URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/status/</span>
              <Input value={page.slug} onChange={(e) => set("slug", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={page.isPublic} onCheckedChange={(v) => set("isPublic", v)} />
            <Label>Make this page publicly accessible</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex gap-2">
              <Input type="color" value={page.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="w-16 h-10 p-1" />
              <Input value={page.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2"><Label>Logo URL</Label><Input value={page.logoUrl || ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://example.com/logo.png" /></div>
        </CardContent>
      </Card>

      <Button className="gap-2" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
      </Button>
    </div>
  );
}
