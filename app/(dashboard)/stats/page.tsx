export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getSessionStats, getChartData } from "@/actions/sessions";
import { getTaskStats } from "@/actions/tasks";
import { StatsShell } from "@/components/stats/StatsShell";
import StatsLoading from "./loading";

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

async function StatsContent() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [weeklySessions, taskStats, initialChartData] = await Promise.all([
    getSessionStats("week"),
    getTaskStats(),
    getChartData("week", 0),
  ]);

  const completedSessions = weeklySessions.filter(
    (s: { completed: boolean }) => s.completed,
  );
  const totalFocusTime = completedSessions.reduce(
    (acc: number, s: { duration: number }) => acc + s.duration,
    0,
  );
  const { currentStreak, longestStreak } = calculateStreaks(weeklySessions);

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
    />
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsLoading />}>
      <StatsContent />
    </Suspense>
  );
}