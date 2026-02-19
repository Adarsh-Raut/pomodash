"use client";

import { useEffect } from "react";
import { useTimerContext } from "@/components/providers/TimerProvider";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { SessionTypeSelector } from "./SessionTypeSelector";
import type { UserSettings, TimerMode } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
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
  }, [settings]);
  useEffect(() => {
    setActiveTaskId(activeTaskId);
  }, [activeTaskId]);

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
    <motion.div layout className="card bg-base-100 shadow-xl overflow-hidden">
      <motion.div
        className={cn("h-1.5 w-full", config.color)}
        animate={{ scaleX: progress / 100 }}
        style={{ transformOrigin: "left" }}
        transition={{ duration: 0.5, ease: "linear" }}
      />

      <div className="card-body gap-6 py-8">
        <SessionTypeSelector
          currentMode={state.mode}
          onModeChange={setMode}
          disabled={state.status === "running"}
        />

        <AnimatePresence mode="wait">
          {activeTaskTitle ? (
            <motion.div
              key="task"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-base-content/70 truncate max-w-xs">
                {activeTaskTitle}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="no-task"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center"
            >
              <span className="text-sm text-base-content/30">
                No task selected
              </span>
            </motion.div>
          )}
        </AnimatePresence>

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

        <AnimatePresence mode="wait">
          {!canStart && state.status === "idle" ? (
            <motion.div
              key="blocked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                disabled
                className="btn btn-wide btn-disabled text-base-content/30 text-lg h-14"
              >
                Select a task first
              </button>
              <p className="text-xs text-base-content/30">
                Pick a task below to begin focusing
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TimerControls
                status={state.status}
                onStart={start}
                onPause={pause}
                onResume={resume}
                onReset={reset}
                onSkip={skip}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.status === "completed" && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn("text-center font-semibold", config.textColor)}
            >
              {state.mode === "focus"
                ? "Great work! Take a break. 🎉"
                : "Break over. Ready to focus? 💪"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
