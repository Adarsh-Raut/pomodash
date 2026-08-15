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
const KEEP_ALIVE_FREQUENCY_HZ = 55;
const KEEP_ALIVE_GAIN = 0.01;

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const bellBufferRef = useRef<AudioBuffer | null>(null);
  const keepAliveRef = useRef<{
    oscillator: OscillatorNode;
    gain: GainNode;
  } | null>(null);
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

  // While a session runs, keep the AudioContext continuously "audible" with a
  // near-inaudible low tone. This stops Chrome from suspending the context
  // (which freezes the audio clock) and from throttling background timers, so
  // the completion bell rings on time even when the tab is hidden.
  const startKeepAlive = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || keepAliveRef.current) return;
    if (!settingsRef.current?.soundEnabled) return;
    try {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = KEEP_ALIVE_FREQUENCY_HZ;
      const gain = ctx.createGain();
      gain.gain.value = KEEP_ALIVE_GAIN;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      keepAliveRef.current = { oscillator, gain };
    } catch {}
  }, []);

  const stopKeepAlive = useCallback(() => {
    const keepAlive = keepAliveRef.current;
    if (!keepAlive) return;
    keepAliveRef.current = null;
    try {
      keepAlive.oscillator.stop();
      keepAlive.oscillator.disconnect();
      keepAlive.gain.disconnect();
    } catch {}
  }, []);

  // Play the bell immediately through the audio rendering thread. The keep-alive
  // keeps running until the bell has finished so Chrome never sees a silent gap
  // to suspend the context mid-playback.
  const playBell = useCallback(
    (volume: number) => {
      const ctx = audioContextRef.current;
      const buffer = bellBufferRef.current;
      const keepAlive = keepAliveRef.current;
      if (!ctx || !buffer) {
        if (keepAlive) stopKeepAlive();
        return;
      }
      try {
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
        source.onended = () => {
          // Only stop the keep-alive we started with; a newly auto-started
          // break session installs its own keep-alive that must survive.
          if (keepAliveRef.current === keepAlive) stopKeepAlive();
        };
      } catch {
        if (keepAliveRef.current === keepAlive) stopKeepAlive();
      }
    },
    [stopKeepAlive],
  );

  // Create/resume the AudioContext and decode the bell within a user gesture.
  // A context resumed inside the Start click is allowed to keep producing
  // sound after the tab is backgrounded.
  const ensureAudio = useCallback(async () => {
    try {
      if (!settingsRef.current?.soundEnabled) return;
      if (!audioContextRef.current) {
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContextRef.current = new Ctx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      if (!bellBufferRef.current) {
        const response = await fetch("/sounds/bell.mp3");
        const arrayBuffer = await response.arrayBuffer();
        bellBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
        // The first session may already be running while the bell decoded.
        if (targetEndTimeRef.current) startKeepAlive();
      }
    } catch {}
  }, [startKeepAlive]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    stopInterval();
    stopKeepAlive();
  }, [stopInterval, stopKeepAlive]);

  const saveSession = useCallback(
    async (mode: TimerMode, completed: boolean, duration: number) => {
      if (duration < 10) return false;
      try {
        await createSession({
          type: modeToSessionType(mode),
          duration,
          completed,
          taskId: activeTaskIdRef.current ?? undefined,
        });
        return true;
      } catch (e) {
        console.error("Failed to save session", e);
        return false;
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
    startKeepAlive();
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
  }, [clearTimer, startKeepAlive]);

  const handleComplete = useCallback(
    async (mode: TimerMode, completedPomodoros: number) => {
      if (completingRef.current) return;
      completingRef.current = true;
      // Stop ticking but leave the keep-alive running so the AudioContext stays
      // audible (and unsuspended) while the session is saved and the bell plays.
      stopInterval();
      const s = settingsRef.current;
      if (!s) {
        completingRef.current = false;
        return;
      }

      const duration = modeToSeconds(mode, s);
      const saved = await saveSession(mode, true, duration);
      if (!saved) {
        // Do not advance to the next timer as though this session was recorded.
        // Keeping the completed timer visible makes a failed write recoverable
        // instead of silently losing a full focus session.
        setState((prev) => ({ ...prev, status: "completed" }));
        completingRef.current = false;
        return;
      }
      resetProgressRefs();
      window.dispatchEvent(new Event("pomodoro-session-saved"));

      // The keep-alive has been keeping the context running (and the background
      // timers unthrottled); playBell stops it after the bell finishes.
      if (s.soundEnabled) {
        playBell(s.soundVolume / 100);
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
    [playBell, resetProgressRefs, saveSession, startInterval, stopInterval],
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

  // Safety net: if Chrome suspended the AudioContext while the tab was hidden,
  // resume it the moment the tab becomes visible again.
  useEffect(() => {
    const handleVisibility = () => {
      const ctx = audioContextRef.current;
      if (!document.hidden && ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const start = useCallback(() => {
    void ensureAudio();
    resetProgressRefs();
    setState((prev) => ({ ...prev, status: "running" }));
    startInterval(state.timeRemaining);
  }, [ensureAudio, resetProgressRefs, startInterval, state.timeRemaining]);

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
