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
import { formatDuration } from "@/lib/utils";

interface TaskStackedChartProps {
  data: DayTaskData[];
  tasks: { id: string; title: string }[];
  emptyMessage?: string;
}

export interface DayTaskData {
  date: string;
  [taskId: string]: number | string;
}

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb923c",
  "#e879f9",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce(
    (acc: number, p: any) => acc + (p.value || 0),
    0,
  );
  if (total === 0) return null; // don't show tooltip for empty bars

  return (
    <div
      style={{
        background: "hsl(220 20% 14%)",
        border: "1px solid hsl(220 20% 24%)",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 180,
      }}
    >
      <p style={{ color: "hsl(220 15% 55%)", fontSize: 11, marginBottom: 8 }}>
        {label}
      </p>
      {payload
        .filter((p: any) => p.value > 0)
        .reverse()
        .map((p: any) => (
          <div
            key={p.dataKey}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: p.fill,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: "#e2e8f0",
                fontSize: 12,
                flex: 1,
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.name}
            </span>
            <span
              style={{
                color: p.fill,
                fontWeight: 700,
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              {formatDuration(p.value * 60)}
            </span>
          </div>
        ))}
      <div
        style={{
          borderTop: "1px solid hsl(220 20% 24%)",
          marginTop: 8,
          paddingTop: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "hsl(220 15% 55%)", fontSize: 11 }}>Total</span>
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          {formatDuration(total * 60)}
        </span>
      </div>
    </div>
  );
}

export function TaskStackedChart({
  data,
  tasks,
  emptyMessage = "No sessions found.",
}: TaskStackedChartProps) {
  // Check if there's any actual data (not just empty rows)
  const hasData =
    tasks.length > 0 &&
    data.some((row) => tasks.some((task) => (row[task.id] as number) > 0));

  if (!hasData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-2 text-base-content/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 opacity-40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <span className="text-sm">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
        >
          <defs>
            {tasks.map((task, i) => (
              <linearGradient
                key={task.id}
                id={`grad-${task.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={COLORS[i % COLORS.length]}
                  stopOpacity={1}
                />
                <stop
                  offset="100%"
                  stopColor={COLORS[i % COLORS.length]}
                  stopOpacity={0.65}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(220 20% 22%)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(220 15% 50%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220 15% 50%)" }}
            axisLine={false}
            tickLine={false}
            unit="m"
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          {tasks.map((task, i) => (
            <Bar
              key={task.id}
              dataKey={task.id}
              name={task.title}
              stackId="focus"
              fill={`url(#grad-${task.id})`}
              radius={i === tasks.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={64}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 px-1">
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-base-content/60 truncate max-w-[140px]">
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
