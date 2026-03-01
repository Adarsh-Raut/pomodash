"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyStats } from "@/types";

interface DailyChartProps {
  data: DailyStats[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const minutes = Math.round(payload[0].value);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const display = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <div
      style={{
        background: "hsl(220 20% 18%)",
        border: "1px solid hsl(220 20% 28%)",
        borderRadius: 12,
        padding: "10px 14px",
      }}
    >
      <p style={{ color: "hsl(220 15% 65%)", fontSize: 12, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: "#60a5fa", fontWeight: 700, fontSize: 15 }}>
        {display} focused
      </p>
      <p style={{ color: "hsl(220 15% 55%)", fontSize: 12 }}>
        {payload[0].payload.sessionsCompleted} sessions
      </p>
    </div>
  );
}

export function DailyChart({ data }: DailyChartProps) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-base-content/50 text-sm">
        No sessions this week yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    focusMinutes: Math.round(d.totalFocusTime / 60),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(220 20% 25%)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(220 15% 55%)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(220 15% 55%)" }}
          axisLine={false}
          tickLine={false}
          unit="m"
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(96,165,250,0.07)" }}
        />
        <Bar
          dataKey="focusMinutes"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
