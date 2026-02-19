"use client";

import { useState } from "react";
import { useTimerContext } from "@/components/providers/TimerProvider";
import { TimerCard } from "@/components/timer/TimerCard";
import { RecentSessions } from "@/components/stats/RecentSessions";
import { TaskList } from "@/components/tasks/TaskList";
import type { UserSettings, PomodoroSessionData } from "@/types";
import type { Task } from "@prisma/client";

interface TodayStats {
  focusTime: string;
  completed: number;
  total: number;
}

interface DashboardClientProps {
  settings: UserSettings;
  recentSessions: PomodoroSessionData[];
  initialTasks: Task[];
  todayStats: TodayStats;
}

export function DashboardClient({
  settings,
  recentSessions,
  initialTasks,
  todayStats,
}: DashboardClientProps) {
  const { activeTaskId, setActiveTaskId } = useTimerContext();
  const [tasks, setTasks] = useState(initialTasks);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <TimerCard
          settings={settings}
          activeTaskId={activeTaskId}
          activeTaskTitle={activeTask?.title}
        />
        <TaskList
          initialTasks={initialTasks}
          activeTaskId={activeTaskId}
          onSelectTask={setActiveTaskId}
          onTasksChange={setTasks}
        />
      </div>

      <div className="space-y-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">Today</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Focus Time",
                  value: todayStats.focusTime,
                  color: "text-primary",
                },
                {
                  label: "Completed",
                  value: todayStats.completed.toString(),
                  color: "text-secondary",
                },
                {
                  label: "Sessions",
                  value: todayStats.total.toString(),
                  color: "text-accent",
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-base-content/50 mt-1">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <RecentSessions sessions={recentSessions} />
      </div>
    </div>
  );
}
