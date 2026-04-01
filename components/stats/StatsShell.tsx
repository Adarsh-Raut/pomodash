"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { formatDuration } from "@/lib/utils";
import { getStatsSnapshot, type ChartData } from "@/actions/sessions";
import type { StatsPeriod } from "@/lib/stats";
import {
  ChevronLeft,
  ChevronRight,
  Timer,
  TrendingUp,
  Flame,
  CheckSquare,
} from "lucide-react";

const TaskStackedChart = dynamic(
  () =>
    import("@/components/stats/TaskStackedChart").then((mod) => mod.TaskStackedChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 flex items-center justify-center">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    ),
  },
);

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

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

interface StatCards {
  label: string;
  totalFocusTime: number;
  partialFocusTime: number;
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
  isArchived: boolean;
  isPartialOnly: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  totalFocusTime: number;
  sessionCount: number;
}

interface StatsShellProps {
  initialSnapshot: {
    period: StatsPeriod;
    offset: number;
    label: string;
    cards: StatCards;
    taskStats: TaskStat[];
    chartData: ChartData;
  };
}

export function StatsShell({ initialSnapshot }: StatsShellProps) {
  const [period, setPeriod] = useState<StatsPeriod>(initialSnapshot.period);
  const [offset, setOffset] = useState(initialSnapshot.offset);
  const [label, setLabel] = useState(initialSnapshot.label);
  const [cards, setCards] = useState(initialSnapshot.cards);
  const [taskStats, setTaskStats] = useState(initialSnapshot.taskStats);
  const [chartData, setChartData] = useState<ChartData>(initialSnapshot.chartData);
  const [tasks, setTasks] = useState(initialSnapshot.chartData.tasks);
  const [isPending, startTransition] = useTransition();
  const [hasFetched, setHasFetched] = useState(false);

  async function fetchSnapshot(newPeriod: StatsPeriod, newOffset: number) {
    const result = await getStatsSnapshot(newPeriod, newOffset);
    setLabel(result.label);
    setCards(result.cards);
    setTaskStats(result.taskStats);
    setTasks(result.chartData.tasks);
    setChartData(result.chartData);
  }

  const handlePeriodChange = (p: StatsPeriod) => {
    setPeriod(p);
    setOffset(0);
    setHasFetched(true);
    startTransition(() => fetchSnapshot(p, 0));
  };

  const handleOffsetChange = (newOffset: number) => {
    setOffset(newOffset);
    setHasFetched(true);
    startTransition(() => fetchSnapshot(period, newOffset));
  };
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
            label: cards.label,
            value: formatDuration(cards.totalFocusTime),
            sub: `${cards.completedSessions} sessions`,
            color: "#60a5fa",
            icon: <Timer className="w-5 h-5" style={{ color: "#60a5fa" }} />,
          },
          {
            label: "Partial Focus",
            value: formatDuration(cards.partialFocusTime),
            sub: "incomplete sessions",
            color: "#34d399",
            icon: (
              <TrendingUp className="w-5 h-5" style={{ color: "#34d399" }} />
            ),
          },
          {
            label: "Streak",
            value: `${cards.currentStreak}d`,
            sub: `Best: ${cards.longestStreak}d`,
            color: "#fbbf24",
            icon: <Flame className="w-5 h-5" style={{ color: "#fbbf24" }} />,
          },
          {
            label: "Tasks",
            value: cards.tasksTracked.toString(),
            sub: `${cards.tasksCompleted} completed`,
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
                  <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
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
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[280px]">
            {isPending && hasFetched ? (
              <div className="h-72 flex items-center justify-center">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : (
              <TaskStackedChart
                data={chartData.data}
                tasks={tasks}
                emptyMessage={`No focus sessions in ${label.toLowerCase()}.`}
              />
            )}
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
            <table className="table">
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
                {[...taskStats]
                  .sort((a, b) => b.totalFocusTime - a.totalFocusTime)
                  .map((task, i) => {
                    const pct = Math.round(
                      (task.completedPomodoros / task.estimatedPomodoros) * 100,
                    );
                    return (
                      <tr
                        key={task.id}
                        className={task.isArchived ? "opacity-75" : undefined}
                      >
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate max-w-[180px]">
                                  {task.title}
                                  {task.isPartialOnly ? " (partial)" : ""}
                                </p>
                                {task.isArchived && (
                                  <span className="badge badge-sm badge-outline border-base-content/20 text-base-content/60">
                                    Archived
                                  </span>
                                )}
                              </div>
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
