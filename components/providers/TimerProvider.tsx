"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createSession } from "@/actions/sessions";
import type { TimerMode, TimerStatus, TimerState } from "@/types";
import type { UserSettings } from "@/types";

interface TimerContextValue {
  state: TimerState;
  settings: UserSettings | null;
  setSettings: (s: UserSettings) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: TimerMode) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx)
    throw new Error("useTimerContext must be used within TimerProvider");
  return ctx;
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

export function TimerProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [state, setState] = useState<TimerState>({
    mode: "focus",
    status: "idle",
    timeRemaining: 25 * 60,
    currentSessionId: null,
    completedPomodoros: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef(0);
  const startTimeRef = useRef<Date | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const settingsRef = useRef<UserSettings | null>(null);

  // Keep refs in sync
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Update timeRemaining when settings change and timer is idle
  useEffect(() => {
    if (!settings) return;
    setState((prev) => {
      if (prev.status !== "idle") return prev;
      return { ...prev, timeRemaining: modeToSeconds(prev.mode, settings) };
    });
  }, [settings]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const saveSession = useCallback(
    async (mode: TimerMode, completed: boolean, duration: number) => {
      if (duration < 10) return;
      try {
        await createSession({
          type: modeToSessionType(mode),
          duration,
          completed,
          taskId: activeTaskIdRef.current ?? undefined,
        });
      } catch (e) {
        console.error("Failed to save session", e);
      }
    },
    [],
  );

  // Auto-start helper — starts the interval directly
  const startInterval = useCallback(() => {
    clearTimer();
    startTimeRef.current = new Date();
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, [clearTimer]);

  const handleComplete = useCallback(
    async (mode: TimerMode, completedPomodoros: number) => {
      clearTimer();
      const s = settingsRef.current;
      if (!s) return;

      const duration = modeToSeconds(mode, s);
      await saveSession(mode, true, duration);

      if (s.soundEnabled) {
        try {
          const audio = new Audio("/sounds/bell.mp3");
          audio.volume = s.soundVolume / 100;
          await audio.play();
        } catch {}
      }

      if (mode === "focus") {
        const newCount = completedPomodoros + 1;
        const shouldLongBreak = newCount % s.longBreakInterval === 0;
        const nextMode: TimerMode = shouldLongBreak
          ? "long_break"
          : "short_break";
        const nextTime = modeToSeconds(nextMode, s);

        setState({
          mode: nextMode,
          status: s.autoStartBreaks ? "running" : "idle",
          timeRemaining: nextTime,
          currentSessionId: null,
          completedPomodoros: newCount,
        });

        // Auto-start break
        if (s.autoStartBreaks) {
          elapsedRef.current = 0;
          startInterval();
        }
      } else {
        // Break done — back to focus
        const nextTime = modeToSeconds("focus", s);
        setState({
          mode: "focus",
          status: s.autoStartFocus ? "running" : "idle",
          timeRemaining: nextTime,
          currentSessionId: null,
          completedPomodoros,
        });

        if (s.autoStartFocus) {
          elapsedRef.current = 0;
          startInterval();
        }
      }
    },
    [clearTimer, saveSession, startInterval],
  );

  // Watch for timer hitting 0
  useEffect(() => {
    if (state.timeRemaining === 0 && state.status === "running") {
      handleComplete(state.mode, state.completedPomodoros);
    }
  }, [
    state.timeRemaining,
    state.status,
    state.mode,
    state.completedPomodoros,
    handleComplete,
  ]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  const start = useCallback(() => {
    elapsedRef.current = 0;
    setState((prev) => ({ ...prev, status: "running" }));
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    clearTimer();
    if (startTimeRef.current) {
      elapsedRef.current += Math.floor(
        (Date.now() - startTimeRef.current.getTime()) / 1000,
      );
      startTimeRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    startTimeRef.current = new Date();
    setState((prev) => ({ ...prev, status: "running" }));
    startInterval();
  }, [startInterval]);

  const reset = useCallback(() => {
    clearTimer();
    const elapsed = elapsedRef.current;
    const s = settingsRef.current;
    if (elapsed > 60 && s) {
      saveSession(state.mode, false, elapsed);
    }
    elapsedRef.current = 0;
    startTimeRef.current = null;
    setState((prev) => ({
      ...prev,
      status: "idle",
      timeRemaining: s ? modeToSeconds(prev.mode, s) : prev.timeRemaining,
    }));
  }, [clearTimer, saveSession, state.mode]);

  const skip = useCallback(() => {
    clearTimer();
    const s = settingsRef.current;
    if (!s) return;
    const nextMode: TimerMode =
      state.mode === "focus" ? "short_break" : "focus";
    setState((prev) => ({
      ...prev,
      mode: nextMode,
      status: "idle",
      timeRemaining: modeToSeconds(nextMode, s),
    }));
  }, [clearTimer, state.mode]);

  const setMode = useCallback(
    (mode: TimerMode) => {
      clearTimer();
      const s = settingsRef.current;
      setState((prev) => ({
        ...prev,
        mode,
        status: "idle",
        timeRemaining: s ? modeToSeconds(mode, s) : prev.timeRemaining,
      }));
    },
    [clearTimer],
  );

  return (
    <TimerContext.Provider
      value={{
        state,
        settings,
        setSettings,
        activeTaskId,
        setActiveTaskId,
        start,
        pause,
        resume,
        reset,
        skip,
        setMode,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
