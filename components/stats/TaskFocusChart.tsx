"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatDuration } from "@/lib/utils";

interface TaskStat {
  id: string;
  title: string;
  totalFocusTime: number;
  sessionCount: number;
  completedPomodoros: number;
  estimatedPomodoros: number;
}

// Hex colors — Recharts can't handle oklch
const COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "hsl(220 20% 18%)",
        border: "1px solid hsl(220 20% 28%)",
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: 160,
      }}
    >
      <p
        style={{
          color: "#e2e8f0",
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        {d.title}
      </p>
      <p style={{ color: "#60a5fa", fontSize: 13 }}>
        {formatDuration(d.totalFocusTime)} focused
      </p>
      <p style={{ color: "hsl(220 15% 55%)", fontSize: 12 }}>
        {d.sessionCount} sessions
      </p>
      <p style={{ color: "hsl(220 15% 55%)", fontSize: 12 }}>
        {d.completedPomodoros}/{d.estimatedPomodoros} pomodoros
      </p>
    </div>
  );
}

export function TaskFocusChart({ data }: { data: TaskStat[] }) {
  const chartData = data
    .map((t) => ({
      ...t,
      shortTitle: t.title.length > 14 ? t.title.slice(0, 14) + "…" : t.title,
      focusMinutes: Math.round(t.totalFocusTime / 60),
    }))
    .sort((a, b) => b.totalFocusTime - a.totalFocusTime)
    .slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
      >
        <defs>
          {COLORS.map((color, i) => (
            <linearGradient
              key={i}
              id={`taskGrad${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(220 20% 25%)"
          vertical={false}
        />
        <XAxis
          dataKey="shortTitle"
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
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="focusMinutes" radius={[6, 6, 0, 0]} maxBarSize={56}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={`url(#taskGrad${index % COLORS.length})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
