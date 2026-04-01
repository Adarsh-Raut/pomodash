"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createSession } from "@/actions/sessions";
import type { TimerMode, TimerState } from "@/types";
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

interface ActiveTaskContextValue {
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

interface TimerActionsContextValue {
  setSettings: (s: UserSettings) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: TimerMode) => void;
}

const TimerStateContext = createContext<TimerState | null>(null);
const TimerSettingsContext = createContext<UserSettings | null>(null);
const ActiveTaskContext = createContext<ActiveTaskContextValue | null>(null);
const TimerActionsContext = createContext<TimerActionsContextValue | null>(null);
const MIN_PARTIAL_SESSION_SECONDS = 60;

export function useTimerContext() {
  const state = useContext(TimerStateContext);
  const settings = useContext(TimerSettingsContext);
  const activeTask = useContext(ActiveTaskContext);
  const actions = useContext(TimerActionsContext);

  if (!state || !activeTask || !actions) {
    throw new Error("useTimerContext must be used within TimerProvider");
  }

  return {
    state,
    settings,
    activeTaskId: activeTask.activeTaskId,
    setSettings: actions.setSettings,
    setActiveTaskId: activeTask.setActiveTaskId,
    start: actions.start,
    pause: actions.pause,
    resume: actions.resume,
    reset: actions.reset,
    skip: actions.skip,
    setMode: actions.setMode,
  } satisfies TimerContextValue;
}

export function useActiveTask() {
  const ctx = useContext(ActiveTaskContext);
  if (!ctx) {
    throw new Error("useActiveTask must be used within TimerProvider");
  }
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
  const [settings, setSettingsState] = useState<UserSettings | null>(null);
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
  const runStartTimeRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const settingsRef = useRef<UserSettings | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completingRef = useRef(false);
  const partialPersistedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    activeTaskIdRef.current = activeTaskId;
  }, [activeTaskId]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const setSettings = useCallback((nextSettings: UserSettings) => {
    setSettingsState(nextSettings);
    setState((prev) => {
      if (prev.status !== "idle") return prev;
      return {
        ...prev,
        timeRemaining: modeToSeconds(prev.mode, nextSettings),
      };
    });
  }, []);

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

  const getElapsedSeconds = useCallback(() => {
    const activeRunSeconds = runStartTimeRef.current
      ? (Date.now() - runStartTimeRef.current) / 1000
      : 0;
    return Math.floor(elapsedRef.current + activeRunSeconds);
  }, []);

  const persistPartialSession = useCallback(() => {
    if (partialPersistedRef.current) return;

    const mode = state.mode;
    const completed = false;
    const duration = getElapsedSeconds();

    if (state.status !== "running" || duration <= MIN_PARTIAL_SESSION_SECONDS) {
      return;
    }

    const payload = JSON.stringify({
      type: modeToSessionType(mode),
      duration,
      completed,
      taskId: activeTaskIdRef.current ?? undefined,
    });

    if (navigator.sendBeacon) {
      partialPersistedRef.current = true;
      navigator.sendBeacon("/api/sessions/partial", payload);
    }
  }, [getElapsedSeconds, state.mode, state.status]);

  const resetProgressRefs = useCallback(() => {
    partialPersistedRef.current = false;
    elapsedRef.current = 0;
    runStartTimeRef.current = null;
    targetEndTimeRef.current = null;
  }, []);

  // Auto-start helper — derives remaining time from the wall clock
  const startInterval = useCallback((durationSeconds: number) => {
    clearTimer();
    runStartTimeRef.current = Date.now();
    targetEndTimeRef.current = Date.now() + durationSeconds * 1000;
    intervalRef.current = setInterval(() => {
      if (!targetEndTimeRef.current) return;

      const nextTimeRemaining = Math.max(
        0,
        Math.ceil((targetEndTimeRef.current - Date.now()) / 1000),
      );

      setState((prev) => {
        if (prev.timeRemaining === nextTimeRemaining) {
          return prev;
        }
        return { ...prev, timeRemaining: nextTimeRemaining };
      });
    }, 250);
  }, [clearTimer]);

  const handleComplete = useCallback(
    async (mode: TimerMode, completedPomodoros: number) => {
      if (completingRef.current) return;
      completingRef.current = true;
      clearTimer();
      const s = settingsRef.current;
      if (!s) {
        completingRef.current = false;
        return;
      }

      const duration = modeToSeconds(mode, s);
      await saveSession(mode, true, duration);
      resetProgressRefs();

      if (s.soundEnabled) {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio("/sounds/bell.mp3");
          }
          audioRef.current.volume = s.soundVolume / 100;
          await audioRef.current.play();
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
          startInterval(nextTime);
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
          startInterval(nextTime);
        }
      }
      completingRef.current = false;
    },
    [clearTimer, resetProgressRefs, saveSession, startInterval],
  );

  // Watch for timer hitting 0
  useEffect(() => {
    if (
      state.timeRemaining === 0 &&
      state.status === "running" &&
      !completingRef.current
    ) {
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

  useEffect(() => {
    const handlePageHide = () => {
      persistPartialSession();
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [persistPartialSession]);

  const start = useCallback(() => {
    resetProgressRefs();
    setState((prev) => ({ ...prev, status: "running" }));
    startInterval(state.timeRemaining);
  }, [resetProgressRefs, startInterval, state.timeRemaining]);

  const pause = useCallback(() => {
    clearTimer();
    if (runStartTimeRef.current) {
      elapsedRef.current += (Date.now() - runStartTimeRef.current) / 1000;
      runStartTimeRef.current = null;
      targetEndTimeRef.current = null;
    }
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, status: "running" }));
    startInterval(state.timeRemaining);
  }, [startInterval, state.timeRemaining]);

  const reset = useCallback(() => {
    clearTimer();
    const elapsed = getElapsedSeconds();
    const s = settingsRef.current;
    if (elapsed > MIN_PARTIAL_SESSION_SECONDS && s) {
      saveSession(state.mode, false, elapsed);
    }
    resetProgressRefs();
    setState((prev) => ({
      ...prev,
      status: "idle",
      timeRemaining: s ? modeToSeconds(prev.mode, s) : prev.timeRemaining,
    }));
  }, [clearTimer, getElapsedSeconds, resetProgressRefs, saveSession, state.mode]);

  const skip = useCallback(() => {
    clearTimer();
    const s = settingsRef.current;
    if (!s) return;
    resetProgressRefs();
    const nextMode: TimerMode =
      state.mode === "focus" ? "short_break" : "focus";
    setState((prev) => ({
      ...prev,
      mode: nextMode,
      status: "idle",
      timeRemaining: modeToSeconds(nextMode, s),
    }));
  }, [clearTimer, resetProgressRefs, state.mode]);

  const setMode = useCallback(
    (mode: TimerMode) => {
      clearTimer();
      const s = settingsRef.current;
      resetProgressRefs();
      setState((prev) => ({
        ...prev,
        mode,
        status: "idle",
        timeRemaining: s ? modeToSeconds(mode, s) : prev.timeRemaining,
      }));
    },
    [clearTimer, resetProgressRefs],
  );

  const activeTaskValue = useMemo(
    () => ({ activeTaskId, setActiveTaskId }),
    [activeTaskId],
  );
  const actionsValue = useMemo(
    () => ({ setSettings, start, pause, resume, reset, skip, setMode }),
    [setSettings, start, pause, resume, reset, skip, setMode],
  );

  return (
    <TimerStateContext.Provider value={state}>
      <TimerSettingsContext.Provider value={settings}>
        <ActiveTaskContext.Provider value={activeTaskValue}>
          <TimerActionsContext.Provider value={actionsValue}>
            {children}
          </TimerActionsContext.Provider>
        </ActiveTaskContext.Provider>
      </TimerSettingsContext.Provider>
    </TimerStateContext.Provider>
  );
}
