// src/hooks/useTimer.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSession } from "@/actions/sessions";
import type { TimerMode, TimerStatus, TimerState } from "@/types";
import type { UserSettings } from "@/types";

interface UseTimerOptions {
  settings: UserSettings;
  activeTaskId: string | null;
  onSessionComplete?: (mode: TimerMode) => void;
}

interface UseTimerReturn {
  state: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: TimerMode) => void;
}

function modeToSeconds(mode: TimerMode, settings: UserSettings): number {
  switch (mode) {
    case "focus":
      return settings.focusDuration;
    case "short_break":
      return settings.shortBreakDuration;
    case "long_break":
      return settings.longBreakDuration;
  }
}

function modeToSessionType(mode: TimerMode) {
  switch (mode) {
    case "focus":
      return "FOCUS" as const;
    case "short_break":
      return "SHORT_BREAK" as const;
    case "long_break":
      return "LONG_BREAK" as const;
  }
}

export function useTimer({
  settings,
  activeTaskId,
  onSessionComplete,
}: UseTimerOptions): UseTimerReturn {
  const [state, setState] = useState<TimerState>({
    mode: "focus",
    status: "idle",
    timeRemaining: settings.focusDuration,
    currentSessionId: null,
    completedPomodoros: 0,
  });

  // useRef for the interval — we don't want re-renders when interval changes
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track the actual start time for accurate duration calculation
  // We don't trust "ticks × 1 second" because JS timers drift
  const sessionStartTimeRef = useRef<Date | null>(null);
  const elapsedBeforePauseRef = useRef<number>(0); // seconds elapsed before pause

  // Clear interval helper — always call this before setting a new one
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Save session to database when completed or abandoned
  const saveSession = useCallback(
    async (mode: TimerMode, completed: boolean, duration: number) => {
      if (duration < 10) return; // Don't save sessions under 10 seconds — likely accidental

      try {
        await createSession({
          type: modeToSessionType(mode),
          duration,
          completed,
          taskId: activeTaskId ?? undefined,
        });
      } catch (error) {
        console.error("Failed to save session:", error);
        // Don't throw — the user shouldn't see a crash because of a save failure
        // In production, you'd want to queue this for retry
      }
    },
    [],
  );

  // Handle timer completion
  const handleComplete = useCallback(
    async (mode: TimerMode) => {
      clearTimer();

      setState((prev) => ({
        ...prev,
        status: "completed",
        timeRemaining: 0,
        completedPomodoros:
          mode === "focus"
            ? prev.completedPomodoros + 1
            : prev.completedPomodoros,
      }));

      const duration = modeToSeconds(mode, settings);
      await saveSession(mode, true, duration);

      onSessionComplete?.(mode);

      // Play sound notification
      if (settings.soundEnabled) {
        try {
          const audio = new Audio("/sounds/bell.mp3");
          audio.volume = settings.soundVolume / 100;
          await audio.play();
        } catch {
          // Audio might be blocked by browser autoplay policy — silent fail
        }
      }

      // Determine next mode
      if (mode === "focus") {
        setState((prev) => {
          const shouldLongBreak =
            (prev.completedPomodoros + 1) % settings.longBreakInterval === 0;
          const nextMode: TimerMode = shouldLongBreak
            ? "long_break"
            : "short_break";

          // Auto-start break if setting enabled
          if (settings.autoStartBreaks) {
            // Small delay before auto-starting
            setTimeout(() => {
              setState((s) => ({
                ...s,
                mode: nextMode,
                status: "running",
                timeRemaining: modeToSeconds(nextMode, settings),
              }));
            }, 1500);
          }

          return {
            ...prev,
            mode: shouldLongBreak ? "long_break" : "short_break",
            status: settings.autoStartBreaks ? "completed" : "idle",
            timeRemaining: modeToSeconds(
              shouldLongBreak ? "long_break" : "short_break",
              settings,
            ),
          };
        });
      } else {
        // Break completed — switch back to focus
        if (settings.autoStartFocus) {
          setTimeout(() => {
            setState((s) => ({
              ...s,
              mode: "focus",
              status: "running",
              timeRemaining: settings.focusDuration,
            }));
          }, 1500);
        } else {
          setState((prev) => ({
            ...prev,
            mode: "focus",
            status: "idle",
            timeRemaining: settings.focusDuration,
          }));
        }
      }
    },
    [clearTimer, settings, saveSession, onSessionComplete],
  );

  // The core tick logic
  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.timeRemaining <= 1) {
        // Let the effect handle completion to avoid stale closures
        return { ...prev, timeRemaining: 0 };
      }
      return { ...prev, timeRemaining: prev.timeRemaining - 1 };
    });
  }, []);

  // Watch for timeRemaining hitting 0 while running
  useEffect(() => {
    if (state.timeRemaining === 0 && state.status === "running") {
      handleComplete(state.mode);
    }
  }, [state.timeRemaining, state.status, state.mode, handleComplete]);

  // Cleanup on unmount — critical to prevent memory leaks
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const start = useCallback(() => {
    sessionStartTimeRef.current = new Date();
    elapsedBeforePauseRef.current = 0;

    setState((prev) => ({ ...prev, status: "running" }));

    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    clearTimer();

    // Track elapsed time for accurate duration saving on abandon
    if (sessionStartTimeRef.current) {
      const elapsed = Math.floor(
        (Date.now() - sessionStartTimeRef.current.getTime()) / 1000,
      );
      elapsedBeforePauseRef.current += elapsed;
      sessionStartTimeRef.current = null;
    }

    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    sessionStartTimeRef.current = new Date();
    setState((prev) => ({ ...prev, status: "running" }));
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const reset = useCallback(() => {
    clearTimer();

    // Save partial session if significant time elapsed
    const elapsed = elapsedBeforePauseRef.current;
    if (elapsed > 60) {
      // Only save if > 1 minute elapsed
      saveSession(state.mode, false, elapsed);
    }

    sessionStartTimeRef.current = null;
    elapsedBeforePauseRef.current = 0;

    setState((prev) => ({
      ...prev,
      status: "idle",
      timeRemaining: modeToSeconds(prev.mode, settings),
    }));
  }, [clearTimer, state.mode, settings, saveSession]);

  const skip = useCallback(() => {
    clearTimer();
    const nextMode: TimerMode =
      state.mode === "focus" ? "short_break" : "focus";

    setState((prev) => ({
      ...prev,
      mode: nextMode,
      status: "idle",
      timeRemaining: modeToSeconds(nextMode, settings),
    }));
  }, [clearTimer, state.mode, settings]);

  const setMode = useCallback(
    (mode: TimerMode) => {
      clearTimer();
      setState((prev) => ({
        ...prev,
        mode,
        status: "idle",
        timeRemaining: modeToSeconds(mode, settings),
      }));
    },
    [clearTimer, settings],
  );

  return { state, start, pause, resume, reset, skip, setMode };
}
