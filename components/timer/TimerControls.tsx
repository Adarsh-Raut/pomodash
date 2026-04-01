// src/components/timer/TimerControls.tsx
"use client";

import { RotateCcw, SkipForward } from "lucide-react";
import type { TimerStatus } from "@/types";

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Reset — always visible when not idle */}
      {status !== "idle" && (
        <button
          onClick={onReset}
          className="btn btn-ghost btn-circle transition-transform duration-150 ease-out"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      )}

      {/* Primary action button */}
      <button
        onClick={
          status === "idle" || status === "completed"
            ? onStart
            : status === "running"
              ? onPause
              : onResume
        }
        className="btn btn-primary btn-wide h-14 text-lg font-bold transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
        aria-label={status === "running" ? "Pause timer" : "Start timer"}
      >
        {status === "idle" && "Start"}
        {status === "running" && "Pause"}
        {status === "paused" && "Resume"}
        {status === "completed" && "Start Next"}
      </button>

      {/* Skip — visible when running or paused */}
      {(status === "running" || status === "paused") && (
        <button
          onClick={onSkip}
          className="btn btn-ghost btn-circle transition-transform duration-150 ease-out"
          aria-label="Skip to next session"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
