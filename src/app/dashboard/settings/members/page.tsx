"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Copy } from "lucide-react";
import { getRoleColor } from "@/lib/utils";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLES = ["admin", "editor", "viewer"];

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<{ id: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [meRes, listRes] = await Promise.all([fetch("/api/me"), fetch("/api/users")]);
      if (meRes.ok) {
        const m = await meRes.json();
        setMe({ id: m.id, role: m.role });
      }
      if (listRes.ok) setMembers(await listRes.json());
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = me?.role === "admin";

  async function invite() {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setTempPassword(data.tempPassword);
        setName("");
        setEmail("");
        setRole("viewer");
        load();
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(id: string, newRole: string) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    if (res.ok) {
      setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
      toast.success("Role updated");
    } else {
      toast.error("Failed to update role");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this member from the organization?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Member removed");
      setMembers((ms) => ms.filter((m) => m.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to remove member");
    }
  }

  function closeDialog() {
    setOpen(false);
    setTempPassword(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to your organization</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{tempPassword ? "Member added" : "Add Member"}</DialogTitle></DialogHeader>
              {tempPassword ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Share this temporary password with the new member. They can change it via “Forgot password”.
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={tempPassword} className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Copied"); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin — full access</SelectItem>
                        <SelectItem value="editor">Editor — manage monitors</SelectItem>
                        <SelectItem value="viewer">Viewer — read only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                {tempPassword ? (
                  <Button onClick={closeDialog}>Done</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button onClick={invite} disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{member.name}{member.id === me?.id && <span className="text-muted-foreground"> (you)</span>}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                  </div>
                  {isAdmin && member.id !== me?.id ? (
                    <>
                      <Select value={member.role} onValueChange={(v) => changeRole(member.id, v)}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => remove(member.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
