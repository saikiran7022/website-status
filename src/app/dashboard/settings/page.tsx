"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getPlanBadgeClass } from "@/lib/utils";
import { toast } from "sonner";

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  org: { name: string; slug: string; plan: string } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [orgName, setOrgName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Me | null) => {
        if (!data) {
          router.push("/login");
          return;
        }
        setMe(data);
        setOrgName(data.org?.name || "");
        setAccountName(data.name);
      });
  }, [router]);

  async function saveOrg() {
    setSavingOrg(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      const data = await res.json();
      res.ok ? toast.success("Organization updated") : toast.error(data.error || "Failed to update");
    } finally {
      setSavingOrg(false);
    }
  }

  async function saveAccount() {
    setSavingAccount(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accountName }),
      });
      const data = await res.json();
      res.ok ? toast.success("Profile updated") : toast.error(data.error || "Failed to update");
    } finally {
      setSavingAccount(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  if (!me) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const isAdmin = me.role === "admin";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and account</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Organization</CardTitle><CardDescription>Update your organization details</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Organization Name</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={!isAdmin} /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={me.org?.slug || ""} disabled /></div>
          <div className="space-y-2"><Label>Plan</Label><div><Badge className={getPlanBadgeClass(me.org?.plan || "free")}>{me.org?.plan || "free"}</Badge></div></div>
          {isAdmin && (
            <Button onClick={saveOrg} disabled={savingOrg}>{savingOrg && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle><CardDescription>Your personal details</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={me.email} disabled /></div>
          <div className="space-y-2"><Label>Role</Label><div><Badge className="capitalize">{me.role}</Badge></div></div>
          <Button onClick={saveAccount} disabled={savingAccount}>{savingAccount && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          <Button onClick={changePassword} disabled={savingPassword}>{savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
