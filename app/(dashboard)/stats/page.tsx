// app/(dashboard)/stats/page.tsx

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getSessionStats } from "@/actions/sessions";
import { getTaskStats } from "@/actions/tasks";
import { StatsShell } from "@/components/stats/StatsShell";

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

  const [weeklySessions, taskStats] = await Promise.all([
    getSessionStats("week"),
    getTaskStats(),
  ]);

  const completedSessions = weeklySessions.filter((s) => s.completed);
  const totalFocusTime = completedSessions.reduce(
    (acc, s) => acc + s.duration,
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
        tasksCompleted: taskStats.filter((t) => t.completed).length,
      }}
      taskStats={taskStats}
    />
  );
}
