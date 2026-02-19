// types/session.ts
import type { SessionType } from "@prisma/client";

export type { SessionType };

export interface PomodoroSessionData {
  id: string;
  userId: string;
  type: SessionType;
  duration: number;
  completed: boolean;
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
}

export interface CreateSessionInput {
  type: SessionType;
  duration: number;
  completed: boolean;
  notes?: string;
  taskId?: string; // add this
}

export interface DailyStats {
  date: string;
  totalFocusTime: number;
  sessionsCompleted: number;
  totalSessions: number;
}

export interface WeeklyStats {
  week: string;
  totalFocusTime: number;
  sessionsCompleted: number;
}
