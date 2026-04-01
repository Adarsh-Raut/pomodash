"use client";

import { useEffect, useRef, useState } from "react";
import { useActiveTask } from "@/components/providers/TimerProvider";
import { TimerCard } from "@/components/timer/TimerCard";
import { RecentSessions } from "@/components/stats/RecentSessions";
import { TaskList } from "@/components/tasks/TaskList";
import type { UserSettings, PomodoroSessionData } from "@/types";
import type { Task } from "@prisma/client";

interface TodayStats {
  focusTime: string;
  partialFocusTime: string;
  completed: number;
  total: number;
}

interface DashboardClientProps {
  settings: UserSettings;
  recentSessions: PomodoroSessionData[];
  initialTasks: Task[];
  todayStats: TodayStats;
}

const ACTIVE_TASK_KEY = "pomodash:activeTaskId";

export function DashboardClient({
  settings,
  recentSessions,
  initialTasks,
  todayStats,
}: DashboardClientProps) {
  const { activeTaskId, setActiveTaskId } = useActiveTask();
  const [tasks, setTasks] = useState(initialTasks);
  const hasRestoredActiveTaskRef = useRef(false);
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (hasRestoredActiveTaskRef.current) return;

    const saved = localStorage.getItem(ACTIVE_TASK_KEY);
    if (saved && tasks.some((t) => t.id === saved)) {
      setActiveTaskId(saved);
    }

    hasRestoredActiveTaskRef.current = true;
  }, [tasks, setActiveTaskId]);

  useEffect(() => {
    if (activeTaskId && !tasks.some((task) => task.id === activeTaskId)) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, setActiveTaskId, tasks]);

  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem(ACTIVE_TASK_KEY, activeTaskId);
    } else {
      localStorage.removeItem(ACTIVE_TASK_KEY);
    }
  }, [activeTaskId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <TimerCard
          settings={settings}
          activeTaskId={activeTaskId}
          activeTaskTitle={activeTask?.title}
        />
        <TaskList
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelectTask={setActiveTaskId}
          onTasksChange={(updater) =>
            setTasks((currentTasks) => updater(currentTasks))
          }
        />
      </div>
      <div className="space-y-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">Today</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Focus Time",
                  value: todayStats.focusTime,
                  color: "text-primary",
                },
                {
                  label: "Partial Focus",
                  value: todayStats.partialFocusTime,
                  color: "text-info",
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
                  <div className="text-xs text-base-content/70 mt-1">
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
