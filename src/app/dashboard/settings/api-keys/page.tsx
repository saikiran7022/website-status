import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Info } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage API keys for programmatic access</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>API Access</CardTitle><CardDescription>Use API keys to authenticate with the REST API</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg mb-6">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p>Include your API key in the <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header:</p>
              <pre className="mt-2 bg-background p-3 rounded text-xs font-mono overflow-x-auto">
                curl -H &quot;Authorization: Bearer ws_session_token&quot; https://your-domain.com/api/v1/monitors
              </pre>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            API keys can be generated via the API. Use your session token (from login) to create and manage API keys.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
