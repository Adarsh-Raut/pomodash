// types/index.ts
export * from "./session";
export * from "./settings";

export type TimerMode = "focus" | "short_break" | "long_break";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  timeRemaining: number;
  currentSessionId: string | null;
  completedPomodoros: number;
}
