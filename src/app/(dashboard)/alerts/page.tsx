import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, Webhook, Plus, AlertTriangle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

const alertRules = [
  { id: "1", monitor: "Production API", type: "down", channel: "email", config: { emails: ["admin@example.com"] }, enabled: true },
  { id: "2", monitor: "Production API", type: "slow_response", channel: "email", config: { emails: ["admin@example.com"], threshold: 5000 }, enabled: true },
  { id: "3", monitor: "Main Website", type: "down", channel: "webhook", config: { url: "https://hooks.slack.com/..." }, enabled: true },
  { id: "4", monitor: "Staging Server", type: "ssl_expiry", channel: "email", config: { emails: ["admin@example.com"], threshold: 30 }, enabled: false },
];

const alertHistory = [
  { id: "1", monitor: "Staging Server", type: "down", triggeredAt: new Date(Date.now() - 3600000), resolvedAt: new Date(Date.now() - 1800000), status: "resolved" as const },
  { id: "2", monitor: "Production API", type: "slow_response", triggeredAt: new Date(Date.now() - 86400000), resolvedAt: new Date(Date.now() - 85000000), status: "resolved" as const },
  { id: "3", monitor: "CDN Endpoint", type: "down", triggeredAt: new Date(Date.now() - 172800000), resolvedAt: null, status: "triggered" as const },
];

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Configure notifications and view alert history</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Create Alert Rule</Button>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {alertRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {rule.channel === "email" ? <Mail className="w-5 h-5 text-muted-foreground" /> : <Webhook className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <p className="font-medium">{rule.monitor}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.type === "down" && "Notify when monitor is down"}
                        {rule.type === "slow_response" && `Notify when response > ${(rule.config as any).threshold}ms`}
                        {rule.type === "ssl_expiry" && `Notify when SSL expires in < ${(rule.config as any).threshold} days`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={rule.type === "down" ? "destructive" : rule.type === "slow_response" ? "warning" : "secondary"}>{rule.type}</Badge>
                    <Badge variant="outline">{rule.channel}</Badge>
                    <Switch checked={rule.enabled} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {alertHistory.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                    <AlertTriangle className={cn("w-5 h-5", alert.status === "triggered" ? "text-red-500" : "text-emerald-500")} />
                    <div className="flex-1">
                      <p className="font-medium">{alert.monitor}</p>
                      <p className="text-sm text-muted-foreground">{alert.type} alert</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Triggered: {formatDate(alert.triggeredAt)}</p>
                      {alert.resolvedAt && <p className="text-emerald-500">Resolved: {formatDate(alert.resolvedAt)}</p>}
                    </div>
                    <Badge variant={alert.status === "triggered" ? "destructive" : "success"}>{alert.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
