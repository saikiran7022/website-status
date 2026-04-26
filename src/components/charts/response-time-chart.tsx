"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";
import { useTheme } from "next-themes";

interface ResponseTimeChartProps {
  data: Array<{
    timestamp: Date;
    p50: number;
    p95: number;
    p99: number;
    actual: number;
  }>;
  title?: string;
}

export function ResponseTimeChart({ data, title }: ResponseTimeChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const formattedData = data.slice(-50).map((d) => ({
    ...d,
    time: format(d.timestamp, "MMM d HH:mm"),
  }));

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#fff",
              border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}ms`, "Response Time"]}
          />
          <Area type="monotone" dataKey="actual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
          <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" dot={false} />
          <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Actual</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" style={{ borderTop: "1px dashed" }} /> p95</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" style={{ borderTop: "1px dashed" }} /> p99</span>
      </div>
    </div>
  );
}
