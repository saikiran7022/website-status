import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Palette } from "lucide-react";
import { getStatusBg, formatUptime } from "@/lib/utils";

export default async function StatusPageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => history.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Status Page</h1>
          <p className="text-muted-foreground">Configure your public status page</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="title">Page Title</Label><Input id="title" defaultValue={`${slug} Status`} /></div>
          <div className="space-y-2"><Label htmlFor="slug">Subdomain Slug</Label><Input id="slug" defaultValue={slug} /></div>
          <div className="flex items-center gap-2"><Switch defaultChecked /><Label>Make this page public</Label></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4" /> Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label htmlFor="accent">Accent Color</Label><div className="flex gap-2"><Input id="accent" type="color" defaultValue="#3b82f6" className="w-16 h-10 p-1" /><Input defaultValue="#3b82f6" /></div></div>
          <div className="space-y-2"><Label htmlFor="logo">Logo URL</Label><Input id="logo" placeholder="https://example.com/logo.png" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monitors</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["Production API", "Main Website", "Database", "CDN"].map((name, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                <Switch defaultChecked={i < 3} />
                <span className={cn("w-2 h-2 rounded-full", getStatusBg(i === 2 ? "up" : "up"))} />
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button className="gap-2"><Save className="w-4 h-4" /> Save Changes</Button>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
