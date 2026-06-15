import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Eye, Pencil } from "lucide-react";
import { getStatusBg, cn } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StatusPagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orgId = user.orgId!;

  const [statusPage, monitors] = await Promise.all([
    prisma.statusPage.findUnique({ where: { orgId } }),
    prisma.monitor.findMany({
      where: { orgId },
      include: { checkResults: { orderBy: { timestamp: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const slug = statusPage?.slug || user.org?.slug || "status";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Status Pages</h1>
        <p className="text-muted-foreground">A public page that shows your services&apos; health</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {statusPage?.title || `${user.org?.name || "Organization"} Status`}
            </CardTitle>
            <Badge variant={statusPage?.isPublic === false ? "secondary" : "default"}>
              {statusPage?.isPublic === false ? "Private" : "Public"}
            </Badge>
          </div>
          <CardDescription>/status/{slug} · {monitors.length} monitors</CardDescription>
        </CardHeader>
        <CardContent>
          {monitors.length === 0 ? (
            <p className="text-muted-foreground py-4">No monitors configured yet.</p>
          ) : (
            <div className="space-y-2">
              {monitors.map((m) => {
                const status = m.checkResults[0]?.status || "unknown";
                return (
                  <div key={m.id} className="flex items-center gap-2 py-1">
                    <span className={cn("w-2 h-2 rounded-full", getStatusBg(status as any))} />
                    <span className="text-sm">{m.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">{m.url}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Link href={`/status/${slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2"><Eye className="w-4 h-4" /> View Public Page</Button>
            </Link>
            <Link href={`/dashboard/status-pages/${slug}`}>
              <Button variant="outline" size="sm" className="gap-2"><Pencil className="w-4 h-4" /> Customize</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
