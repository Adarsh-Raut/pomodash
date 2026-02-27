export const revalidate = 60;

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getSessionStats, getSessionsInRange } from "@/actions/sessions";
import { getTaskStats } from "@/actions/tasks";
import { StatsShell } from "@/components/stats/StatsShell";
import type { DayTaskData } from "@/components/stats/TaskStackedChart";

export const metadata: Metadata = { title: "Stats" };

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
    } else break;
  }

  const sortedDays = Array.from(completedDays)
    .map((d) => new Date(d))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let temp = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) temp = 1;
    else {
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

  // Current week bounds (Monday–Sunday)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const [weeklySessions, taskStats, initialSessions] = await Promise.all([
    getSessionStats("week"),
    getTaskStats(),
    getSessionsInRange(monday, sunday),
  ]);

  const completedSessions = weeklySessions.filter(
    (s: { completed: boolean }) => s.completed,
  );
  const totalFocusTime = completedSessions.reduce(
    (acc: number, s: { duration: number }) => acc + s.duration,
    0,
  );
  const { currentStreak, longestStreak } = calculateStreaks(weeklySessions);

  // Build initial chart data for this week
  const taskMap = new Map<string, { id: string; title: string }>();
  initialSessions.forEach((s) => {
    if (s.task) taskMap.set(s.task.id, s.task);
  });
  const initialTasks = Array.from(taskMap.values());

  const initialChartData: DayTaskData[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateObj = new Date(d);
    dateObj.setHours(0, 0, 0, 0);
    const date =
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      ` (${d.toLocaleDateString("en-US", { weekday: "short" })})`;

    const row: DayTaskData = { date };
    initialTasks.forEach((task) => {
      const secs = initialSessions
        .filter(
          (s) =>
            s.taskId === task.id &&
            new Date(s.startedAt).toDateString() === dateObj.toDateString(),
        )
        .reduce((acc, s) => acc + s.duration, 0);
      row[task.id] = Math.round(secs / 60);
    });
    return row;
  });

  return (
    <StatsShell
      initialCards={{
        totalFocusTime,
        completedSessions: completedSessions.length,
        currentStreak,
        longestStreak,
        tasksTracked: taskStats.length,
        tasksCompleted: taskStats.filter(
          (t: { completed: boolean }) => t.completed,
        ).length,
      }}
      taskStats={taskStats}
      initialChartData={initialChartData}
      initialTasks={initialTasks}
    />
  );
}
