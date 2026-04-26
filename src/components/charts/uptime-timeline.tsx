"use client";
import { format } from "date-fns";
import { cn, getStatusBg } from "@/lib/utils";

interface UptimeTimelineProps {
  data: Array<{
    date: Date;
    status: "up" | "down" | "partial" | "none";
  }>;
  className?: string;
}

export function UptimeTimeline({ data, className }: UptimeTimelineProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-[2px] h-12">
        {data.map((entry, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 min-w-[3px] rounded-sm transition-all hover:opacity-80 cursor-pointer",
              getStatusBg(entry.status),
              entry.status === "none" && "bg-gray-200 dark:bg-gray-700"
            )}
            style={{ height: entry.status === "down" ? "100%" : entry.status === "partial" ? "60%" : "100%" }}
            title={`${format(entry.date, "MMM d, yyyy")}: ${entry.status}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>{format(data[0]?.date ?? new Date(), "MMM d")}</span>
        <span>{format(data[data.length - 1]?.date ?? new Date(), "MMM d")}</span>
      </div>
    </div>
  );
}
