import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Globe, Eye } from "lucide-react";
import { formatDate, getStatusBg } from "@/lib/utils";

const statusPages = [
  { id: "1", slug: "demo", title: "Demo Status Page", public: true, monitors: 5, accentColor: "#3b82f6", createdAt: new Date(Date.now() - 86400000 * 30) },
  { id: "2", slug: "acme-inc", title: "Acme Inc Status", public: true, monitors: 3, accentColor: "#10b981", createdAt: new Date(Date.now() - 86400000 * 15) },
];

export default function StatusPagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Status Pages</h1>
          <p className="text-muted-foreground">Public status pages for your services</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Create Status Page</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {statusPages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {page.title}
                </CardTitle>
                {page.public && <Badge variant="success">Public</Badge>}
              </div>
              <CardDescription>
                status.yourdomain.com/{page.slug} · {page.monitors} monitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: page.monitors }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", getStatusBg(i === 2 ? "down" : "up"))} />
                    <span className="text-sm">{["API", "Website", "Database", "CDN", "DNS"][i]}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{(95 + Math.random() * 5).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Link href={`/status/${page.slug}`} target="_blank">
                  <Button variant="outline" size="sm" className="gap-2"><Eye className="w-4 h-4" /> View</Button>
                </Link>
                <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="w-4 h-4" /> Edit</Button>
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
