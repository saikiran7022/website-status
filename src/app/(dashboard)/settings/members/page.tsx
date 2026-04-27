import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRoleColor } from "@/lib/utils";

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgId = (user as any).orgId;
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });

  const members = org?.members || [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Manage who has access to your organization</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle><CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No members yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
