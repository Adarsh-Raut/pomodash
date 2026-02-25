export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getUserSettings } from "@/actions/settings";
import { getRecentSessions, getSessionStats } from "@/actions/sessions";
import { getTasks } from "@/actions/tasks";
import { formatDuration } from "@/lib/utils";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [settings, recentSessions, tasks, todaySessions] = await Promise.all([
    getUserSettings(),
    getRecentSessions(5),
    getTasks(),
    getSessionStats("day"),
  ]);

  const completed = todaySessions.filter((s) => s.completed);
  const totalFocusTime = completed.reduce((acc, s) => acc + s.duration, 0);

  const todayStats = {
    focusTime: formatDuration(totalFocusTime),
    completed: completed.length,
    total: todaySessions.length,
  };

  return (
    <DashboardClient
      settings={settings}
      recentSessions={recentSessions}
      initialTasks={tasks}
      todayStats={todayStats}
    />
  );
}
