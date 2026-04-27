import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const org = (user as any).org;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization settings</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Organization</CardTitle><CardDescription>Update your organization details</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Organization Name</Label><Input defaultValue={org?.name || "My Organization"} /></div>
          <div className="space-y-2"><Label>Slug</Label><Input defaultValue={org?.slug || "my-org"} disabled /></div>
          <div className="space-y-2"><Label>Plan</Label><Badge>Free</Badge></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle><CardDescription>Your account details</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input defaultValue={user.name} /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
          <div className="space-y-2"><Label>Role</Label><Badge className="capitalize">{(user as any).role || user.role}</Badge></div>
        </CardContent>
      </Card>
    </div>
  );
}
