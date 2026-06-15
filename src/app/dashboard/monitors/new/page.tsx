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
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface FormState {
  name: string;
  url: string;
  method: string;
  interval: number; // minutes
  timeout: number; // ms
  expectedStatus: string;
  keyword: string;
  headers: string;
  body: string;
  enabled: boolean;
}

export default function NewMonitorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    url: "",
    method: "GET",
    interval: 5,
    timeout: 30000,
    expectedStatus: "",
    keyword: "",
    headers: "",
    body: "",
    enabled: true,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function payload() {
    return {
      name: form.name,
      url: form.url,
      method: form.method,
      interval: form.interval,
      timeout: form.timeout,
      expectedStatus: form.expectedStatus ? Number(form.expectedStatus) : undefined,
      keyword: form.keyword || undefined,
      headers: form.headers || undefined,
      body: form.body || undefined,
      enabled: form.enabled,
    };
  }

  async function handleTest() {
    if (!form.url) {
      toast.error("Enter a URL to test");
      return;
    }
    if (form.headers) {
      try {
        JSON.parse(form.headers);
      } catch {
        toast.error("Custom headers must be valid JSON");
        return;
      }
    }
    setTesting(true);
    try {
      const res = await fetch("/api/monitors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Test failed");
      } else if (data.status === "up") {
        toast.success(`Up — HTTP ${data.statusCode} in ${data.responseTime}ms`);
      } else if (data.status === "degraded") {
        toast.warning(`Degraded — HTTP ${data.statusCode} in ${data.responseTime}ms`);
      } else {
        toast.error(`Down — ${data.error || "check failed"}`);
      }
    } catch {
      toast.error("Test request failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.headers) {
      try {
        JSON.parse(form.headers);
      } catch {
        toast.error("Custom headers must be valid JSON");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        toast.success("Monitor created");
        router.push(`/dashboard/monitors/${data.id}`);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to create monitor");
      }
    } catch {
      toast.error("Failed to create monitor");
    } finally {
      setLoading(false);
    }
  }

  const isHttp = form.method !== "HEAD";

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
                <Input id="name" placeholder="My Website" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method</Label>
                <Select value={form.method} onValueChange={(v) => set("method", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" placeholder="https://example.com" value={form.url} onChange={(e) => set("url", e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interval">Check Interval</Label>
                <Select value={String(form.interval)} onValueChange={(v) => set("interval", parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every 1 minute</SelectItem>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="10">Every 10 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input id="timeout" type="number" value={form.timeout} onChange={(e) => set("timeout", parseInt(e.target.value) || 30000)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedStatus">Expected Status Code (optional)</Label>
                <Input id="expectedStatus" type="number" placeholder="Any 2xx/3xx" value={form.expectedStatus} onChange={(e) => set("expectedStatus", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword Match (optional)</Label>
                <Input id="keyword" placeholder="Text expected in response" value={form.keyword} onChange={(e) => set("keyword", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Custom Headers (JSON, optional)</Label>
              <Textarea id="headers" placeholder='{"Authorization": "Bearer token"}' value={form.headers} onChange={(e) => set("headers", e.target.value)} />
            </div>

            {isHttp && form.method !== "GET" && (
              <div className="space-y-2">
                <Label htmlFor="body">Request Body (optional)</Label>
                <Textarea id="body" placeholder="Request body for POST/PUT/PATCH" value={form.body} onChange={(e) => set("body", e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch id="enabled" checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
              <Label htmlFor="enabled">Enable monitor immediately</Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Test
              </Button>
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
