export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { getUserSettings } from "@/actions/settings";
import { getRecentSessions, getSessionStats } from "@/actions/sessions";
import { getTasks } from "@/actions/tasks";
import { formatDuration } from "@/lib/utils";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import DashboardLoading from "./loading";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardContent() {
  const [settings, recentSessions, tasks, todaySessions] = await Promise.all([
    getUserSettings(),
    getRecentSessions(5),
    getTasks(),
    getSessionStats("day"),
  ]);

  const completed = todaySessions.filter(
    (s: { completed: boolean; duration: number; startedAt: Date }) =>
      s.completed,
  );
  const totalFocusTime = completed.reduce(
    (
      acc: number,
      s: { completed: boolean; duration: number; startedAt: Date },
    ) => acc + s.duration,
    0,
  );

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

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
