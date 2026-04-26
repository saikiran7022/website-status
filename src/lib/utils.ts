import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatUptime(percent: number): string {
  return percent.toFixed(2) + "%";
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatResponseTime(ms: number | null): string {
  if (ms === null) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getStatusColor(status: "up" | "down" | "degraded" | "paused" | "partial" | "none"): string {
  switch (status) {
    case "up": return "text-emerald-500";
    case "down": return "text-red-500";
    case "degraded": return "text-amber-500";
    case "paused": return "text-gray-400";
    default: return "text-gray-400";
  }
}

export function getStatusBg(status: "up" | "down" | "degraded" | "paused" | "partial" | "none"): string {
  switch (status) {
    case "up": return "bg-emerald-500";
    case "down": return "bg-red-500";
    case "degraded": return "bg-amber-500";
    case "paused": return "bg-gray-400";
    case "partial": return "bg-amber-500";
    case "none": return "bg-gray-400";
    default: return "bg-gray-400";
  }
}

export function getIncidentStatusColor(status: string): string {
  switch (status) {
    case "investigating": return "text-red-500";
    case "identified": return "text-amber-500";
    case "monitoring": return "text-blue-500";
    case "resolved": return "text-emerald-500";
    default: return "text-gray-400";
  }
}

export function getIncidentSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "major": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "minor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "maintenance": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "admin": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "editor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "viewer": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default: return "bg-gray-100 text-gray-800";
  }
}

export function getPlanBadgeClass(plan: string): string {
  switch (plan) {
    case "enterprise": return "bg-gradient-to-r from-purple-500 to-indigo-500 text-white";
    case "pro": return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    case "free": return "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    default: return "bg-gray-200 text-gray-700";
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateId(): string {
  return crypto.randomUUID();
}
