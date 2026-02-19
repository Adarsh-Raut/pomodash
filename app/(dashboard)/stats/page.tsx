// app/(dashboard)/stats/page.tsx
import type { Metadata } from "next";
import { getSessionStats } from "@/actions/sessions";
import { getTaskStats } from "@/actions/tasks";
import { TaskStackedChart } from "@/components/stats/TaskStackedChart";
import type { DayTaskData } from "@/components/stats/TaskStackedChart";
import { formatDuration } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Stats" };

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

function calculateStreaks(sessions: { startedAt: Date; completed: boolean }[]) {
  const completedDays = new Set(
    sessions
      .filter((s) => s.completed)
      .map((s) => new Date(s.startedAt).toDateString()),
  );

  let currentStreak = 0;
  const checking = new Date();

  for (let i = 0; i < 365; i++) {
    if (completedDays.has(checking.toDateString())) {
      currentStreak++;
      checking.setDate(checking.getDate() - 1);
    } else if (i === 0) {
      checking.setDate(checking.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDays = Array.from(completedDays)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let temp = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      temp = 1;
    } else {
      const diff =
        (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / 86400000;
      temp = diff === 1 ? temp + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, temp);
  }

  return { currentStreak, longestStreak };
}

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [rawSessions, taskStats, weeklySessions] = await Promise.all([
    prisma.pomodoroSession.findMany({
      where: {
        userId: session.user.id,
        type: "FOCUS",
        completed: true,
        startedAt: { gte: sevenDaysAgo },
        taskId: { not: null },
      },
      include: { task: { select: { id: true, title: true } } },
      orderBy: { startedAt: "asc" },
    }),
    getTaskStats(),
    getSessionStats("week"),
  ]);

  const completedSessions = weeklySessions.filter((s) => s.completed);
  const totalFocusTime = completedSessions.reduce(
    (acc, s) => acc + s.duration,
    0,
  );
  const avgPerDay = Math.round(totalFocusTime / 7);
  const { currentStreak, longestStreak } = calculateStreaks(weeklySessions);

  // Build last 7 days
  const days: { date: string; dateObj: Date }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      dateObj: d,
      date: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
    });
  }

  // Unique tasks that have sessions this week
  const taskMap = new Map<string, { id: string; title: string }>();
  rawSessions.forEach((s) => {
    if (s.task) taskMap.set(s.task.id, s.task);
  });
  const tasks = Array.from(taskMap.values());

  // Build stacked chart data
  const chartData: DayTaskData[] = days.map(({ date, dateObj }) => {
    const row: DayTaskData = { date };
    tasks.forEach((task) => {
      const mins =
        rawSessions
          .filter(
            (s) =>
              s.taskId === task.id &&
              new Date(s.startedAt).toDateString() === dateObj.toDateString(),
          )
          .reduce((acc, s) => acc + s.duration, 0) / 60;
      row[task.id] = Math.round(mins);
    });
    return row;
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-base-content/40 text-sm mt-1">
          Your focus patterns, visualized.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "This Week",
            value: formatDuration(totalFocusTime),
            sub: `${completedSessions.length} sessions`,
            color: "#60a5fa",
            icon: "⏱",
          },
          {
            label: "Daily Average",
            value: formatDuration(avgPerDay),
            sub: "per day",
            color: "#34d399",
            icon: "📈",
          },
          {
            label: "Current Streak",
            value: `${currentStreak}d`,
            sub: `Best: ${longestStreak}d`,
            color: "#fbbf24",
            icon: "🔥",
          },
          {
            label: "Tasks Tracked",
            value: taskStats.length.toString(),
            sub: `${taskStats.filter((t) => t.completed).length} completed`,
            color: "#a78bfa",
            icon: "✅",
          },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="card bg-base-100 shadow">
            <div className="card-body p-5 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/40 font-medium uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-xl">{icon}</span>
              </div>
              <div className="text-3xl font-black" style={{ color }}>
                {value}
              </div>
              <div className="text-xs text-base-content/40">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stacked task chart */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-6 gap-4">
          <div>
            <h2 className="font-bold">Focus Time by Task</h2>
            <p className="text-xs text-base-content/40 mt-0.5">
              Last 7 days — each color is a task
            </p>
          </div>
          <TaskStackedChart data={chartData} tasks={tasks} />
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
                <tr className="text-xs uppercase text-base-content/30 tracking-wider">
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
