"use client";

import { useEffect } from "react";
import { useTimerContext } from "@/components/providers/TimerProvider";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { SessionTypeSelector } from "./SessionTypeSelector";
import type { UserSettings } from "@/types";
import { cn } from "@/lib/utils";

interface TimerCardProps {
  settings: UserSettings;
  activeTaskId: string | null;
  activeTaskTitle?: string | null;
}

const modeConfig = {
  focus: { color: "bg-primary", textColor: "text-primary" },
  short_break: { color: "bg-secondary", textColor: "text-secondary" },
  long_break: { color: "bg-accent", textColor: "text-accent" },
};

export function TimerCard({
  settings,
  activeTaskId,
  activeTaskTitle,
}: TimerCardProps) {
  const {
    state,
    setSettings,
    setActiveTaskId,
    start,
    pause,
    resume,
    reset,
    skip,
    setMode,
  } = useTimerContext();

  // Sync settings and activeTaskId into context
  useEffect(() => {
    setSettings(settings);
  }, [settings, setSettings]);
  useEffect(() => {
    setActiveTaskId(activeTaskId);
  }, [activeTaskId, setActiveTaskId]);

  useEffect(() => {
    if (state.status === "running" || state.status === "paused") {
      const minutes = Math.floor(state.timeRemaining / 60);
      const seconds = state.timeRemaining % 60;
      const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const label =
        state.mode === "focus"
          ? activeTaskTitle
            ? `— ${activeTaskTitle}`
            : "— Pomodash"
          : state.mode === "short_break"
            ? "— Short Break"
            : "— Long Break";
      document.title = `${time} ${label}`;
    } else {
      document.title = "Pomodash — Stay Focused";
    }
  }, [state.timeRemaining, state.status, state.mode, activeTaskTitle]);

  const config = modeConfig[state.mode];
  const totalDuration =
    state.mode === "focus"
      ? settings.focusDuration
      : state.mode === "short_break"
        ? settings.shortBreakDuration
        : settings.longBreakDuration;

  const progress =
    ((totalDuration - state.timeRemaining) / totalDuration) * 100;
  const canStart = !!activeTaskId;

  return (
    <div className="card bg-base-100 shadow-xl overflow-hidden">
      <div
        className={cn("h-1.5 w-full", config.color)}
        style={{
          transformOrigin: "left",
          transform: `scaleX(${progress / 100})`,
          transition: state.status === "running" ? "transform 500ms linear" : "none",
        }}
      />

      <div className="card-body gap-6 py-8">
        <SessionTypeSelector
          currentMode={state.mode}
          onModeChange={setMode}
          disabled={state.status === "running"}
        />

        {activeTaskTitle ? (
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="max-w-xs truncate text-sm font-medium text-base-content/70">
              {activeTaskTitle}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="text-sm text-base-content/70">No task selected</span>
          </div>
        )}

        <TimerDisplay
          timeRemaining={state.timeRemaining}
          totalDuration={totalDuration}
          status={state.status}
          mode={state.mode}
        />

        <div className="flex justify-center gap-2">
          {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                i < state.completedPomodoros % settings.longBreakInterval
                  ? "bg-primary"
                  : "bg-base-300",
              )}
            />
          ))}
        </div>

        {!canStart && state.status === "idle" ? (
          <div className="flex flex-col items-center gap-3">
            <button
              disabled
              className="btn btn-wide btn-disabled h-14 text-lg text-base-content/50"
            >
              Select a task first
            </button>
            <p className="text-xs text-base-content/70">
              Pick a task below to begin focusing
            </p>
          </div>
        ) : (
          <TimerControls
            status={state.status}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onSkip={skip}
          />
        )}

        {state.status === "completed" && (
          <p className={cn("text-center font-semibold", config.textColor)}>
            {state.mode === "focus"
              ? "Great work! Take a break. 🎉"
              : "Break over. Ready to focus? 💪"}
          </p>
        )}
      </div>
    </div>
  );
}
