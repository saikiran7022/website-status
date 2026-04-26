export type MonitorType = "http" | "https" | "tcp" | "ping" | "dns";
export type MonitorMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";
export type MembershipRole = "admin" | "editor" | "viewer";
export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
export type IncidentSeverity = "critical" | "major" | "minor" | "maintenance";
export type AlertType = "down" | "slow_response" | "ssl_expiry";
export type AlertChannel = "email" | "webhook";
export type Plan = "free" | "pro" | "enterprise";

export interface MonitorStatus {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  enabled: boolean;
  status: "up" | "down" | "degraded" | "paused";
  uptimePercent: number;
  responseTime: number | null;
  lastChecked: Date | null;
}

export interface UptimeTimelineEntry {
  date: Date;
  status: "up" | "down" | "partial" | "none";
  checks: number;
  failures: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  avgUptime: number;
  avgResponseTime: number | null;
}
