"use client";

import { useState, useTransition } from "react";
import { formatDuration } from "@/lib/utils";
import { getChartData, type ChartData } from "@/actions/sessions";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, TrendingUp, Flame, CheckSquare } from "lucide-react";
import { TaskStackedChart, type DayTaskData } from "@/components/stats/TaskStackedChart";

type Period = "week" | "month" | "year";

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

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

function getPeriodLabel(period: Period, offset: number): string {
  const now = new Date();
  if (period === "week") {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek - offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    if (offset === 0) return "This Week";
    if (offset === 1) return "Last Week";
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    return `${fmt(monday)} – ${fmt(sunday)}`;
  }
  if (period === "month") {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    if (offset === 0) return "This Month";
    if (offset === 1) return "Last Month";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  const year = now.getFullYear() - offset;
  if (offset === 0) return "This Year";
  if (offset === 1) return "Last Year";
  return String(year);
}

interface StatCards {
  totalFocusTime: number;
  completedSessions: number;
  currentStreak: number;
  longestStreak: number;
  tasksTracked: number;
  tasksCompleted: number;
}

interface TaskStat {
  id: string;
  title: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  totalFocusTime: number;
  sessionCount: number;
}

interface StatsShellProps {
  initialCards: StatCards;
  taskStats: TaskStat[];
  initialChartData: ChartData;
}

export function StatsShell({
  initialCards,
  taskStats,
  initialChartData,
}: StatsShellProps) {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);
  const [chartData, setChartData] = useState<ChartData>(initialChartData);
  const [tasks, setTasks] = useState(initialChartData.tasks);
  const [isPending, startTransition] = useTransition();
  const [hasFetched, setHasFetched] = useState(false);

  async function fetchChartData(newPeriod: Period, newOffset: number) {
    const result = await getChartData(newPeriod, newOffset);
    setTasks(result.tasks);
    setChartData(result);
  }

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setOffset(0);
    setHasFetched(true);
    startTransition(() => fetchChartData(p, 0));
  };

  const handleOffsetChange = (newOffset: number) => {
    setOffset(newOffset);
    setHasFetched(true);
    startTransition(() => fetchChartData(period, newOffset));
  };

  const label = getPeriodLabel(period, offset);
  const totalMins = chartData.data.reduce(
    (acc, row) =>
      acc + tasks.reduce((t, task) => t + ((row[task.id] as number) || 0), 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-base-content/70 text-sm mt-1">
          Your focus patterns, visualized.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "This Week",
            value: formatDuration(initialCards.totalFocusTime),
            sub: `${initialCards.completedSessions} sessions`,
            color: "#60a5fa",
            icon: <Timer className="w-5 h-5" style={{ color: "#60a5fa" }} />,
          },
          {
            label: "Daily Avg",
            value: formatDuration(Math.round(initialCards.totalFocusTime / 7)),
            sub: "per day",
            color: "#34d399",
            icon: (
              <TrendingUp className="w-5 h-5" style={{ color: "#34d399" }} />
            ),
          },
          {
            label: "Streak",
            value: `${initialCards.currentStreak}d`,
            sub: `Best: ${initialCards.longestStreak}d`,
            color: "#fbbf24",
            icon: <Flame className="w-5 h-5" style={{ color: "#fbbf24" }} />,
          },
          {
            label: "Tasks",
            value: initialCards.tasksTracked.toString(),
            sub: `${initialCards.tasksCompleted} completed`,
            color: "#a78bfa",
            icon: (
              <CheckSquare className="w-5 h-5" style={{ color: "#a78bfa" }} />
            ),
          },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="card bg-base-100 shadow">
            <div className="card-body p-5 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/70 font-medium uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-xl">{icon}</span>
              </div>
              <div className="text-3xl font-black" style={{ color }}>
                {value}
              </div>
              <div className="text-xs text-base-content/70">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart card */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-6 gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">Focus Time by Task</h2>
              <p className="text-xs text-base-content/70 mt-0.5">
                {label} · {formatDuration(totalMins * 60)} total
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex rounded-lg border border-base-300 overflow-hidden">
                {PERIOD_OPTIONS.map(({ value, label: pLabel }) => (
                  <button
                    key={value}
                    onClick={() => handlePeriodChange(value)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      period === value
                        ? "bg-primary text-primary-content"
                        : "text-base-content/70 hover:text-base-content hover:bg-base-200"
                    }`}
                  >
                    {pLabel}
                  </button>
                ))}
              </div>

              <div className="flex items-center rounded-lg border border-base-300 overflow-hidden">
                <button
                  onClick={() => handleOffsetChange(offset + 1)}
                  className="px-3 py-1.5 text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors border-r border-base-300"
                  aria-label="Previous period"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="px-4 py-1.5 text-sm font-medium min-w-[140px] text-center">
                  {label}
                </span>
                <button
                  onClick={() => handleOffsetChange(Math.max(0, offset - 1))}
                  disabled={offset === 0}
                  className="px-3 py-1.5 text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors border-l border-base-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next period"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${period}-${offset}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {isPending && hasFetched ? (
                  <div className="h-72 flex items-center justify-center">
                    <span className="loading loading-spinner loading-md text-primary" />
                  </div>
                ) : (
                  <TaskStackedChart
                    data={chartData.data}
                    tasks={tasks}
                    emptyMessage={`No focus sessions in ${getPeriodLabel(period, offset).toLowerCase()}.`}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Task breakdown table */}
      {taskStats.length > 0 && (
        <div className="card bg-base-100 shadow overflow-hidden">
          <div className="card-body p-5 pb-0">
            <h2 className="font-bold">Task Breakdown</h2>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra">
              <thead>
                <tr className="text-xs uppercase text-base-content/50 tracking-wider">
                  <th>Task</th>
                  <th className="text-center">Pomodoros</th>
                  <th className="text-center">Sessions</th>
                  <th className="text-right">Focus Time</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {taskStats
                  .sort((a, b) => b.totalFocusTime - a.totalFocusTime)
                  .map((task, i) => {
                    const pct = Math.round(
                      (task.completedPomodoros / task.estimatedPomodoros) * 100,
                    );
                    return (
                      <tr key={task.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium text-sm truncate max-w-[180px]">
                                {task.title}
                              </p>
                              <div className="w-20 bg-base-300 rounded-full h-1 mt-1">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(100, pct)}%`,
                                    background:
                                      pct >= 100
                                        ? "#34d399"
                                        : COLORS[i % COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center text-sm tabular-nums">
                          {task.completedPomodoros}/{task.estimatedPomodoros}
                        </td>
                        <td className="text-center text-sm tabular-nums">
                          {task.sessionCount}
                        </td>
                        <td className="text-right font-mono text-sm tabular-nums text-blue-400">
                          {formatDuration(task.totalFocusTime)}
                        </td>
                        <td className="text-right">
                          {task.completed ? (
                            <span className="badge badge-success badge-sm">
                              Done
                            </span>
                          ) : pct >= 100 ? (
                            <span className="badge badge-warning badge-sm">
                              Review
                            </span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}