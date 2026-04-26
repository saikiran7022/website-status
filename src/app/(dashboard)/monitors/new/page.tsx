"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewMonitorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "https",
    method: "GET",
    interval: 300,
    timeout: 30000,
    expectedStatusCode: 200,
    keyword: "",
    headers: "",
    body: "",
    enabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headersObj = formData.headers ? JSON.parse(formData.headers) : undefined;
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          interval: Math.floor(formData.interval / 60), // convert seconds to minutes for DB
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        toast.success("Monitor created successfully");
        router.push(`/dashboard/monitors/${data.id}`);
      } else {
        toast.error(data.error || "Failed to create monitor");
      }
    } catch (err) {
      toast.error("Failed to create monitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Monitor</h1>
          <p className="text-muted-foreground">Add a new endpoint to monitor</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor Details</CardTitle>
          <CardDescription>Configure the endpoint you want to monitor</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Monitor Name</Label>
                <Input id="name" placeholder="My Website" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Monitor Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="ping">Ping</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL / Host</Label>
              <Input id="url" placeholder="https://example.com" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} required />
            </div>

            {(formData.type === "http" || formData.type === "https") && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP Method</Label>
                    <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedStatusCode">Expected Status Code</Label>
                    <Input id="expectedStatusCode" type="number" value={formData.expectedStatusCode} onChange={(e) => setFormData({ ...formData, expectedStatusCode: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword Match (optional)</Label>
                  <Input id="keyword" placeholder="Required text in response" value={formData.keyword} onChange={(e) => setFormData({ ...formData, keyword: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headers">Custom Headers (JSON)</Label>
                  <Textarea id="headers" placeholder='{"Authorization": "Bearer token"}' value={formData.headers} onChange={(e) => setFormData({ ...formData, headers: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Request Body</Label>
                  <Textarea id="body" placeholder="Request body for POST/PUT" value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interval">Check Interval (seconds)</Label>
                <Select value={String(formData.interval)} onValueChange={(v) => setFormData({ ...formData, interval: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="600">10 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input id="timeout" type="number" value={formData.timeout} onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="enabled" checked={formData.enabled} onCheckedChange={(v) => setFormData({ ...formData, enabled: v })} />
              <Label htmlFor="enabled">Enable monitor immediately</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Monitor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
