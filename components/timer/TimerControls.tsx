// src/components/timer/TimerControls.tsx
"use client";

import { motion } from "framer-motion";
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
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onReset}
          className="btn btn-ghost btn-circle"
          aria-label="Reset timer"
        >
          {/* Reset icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </motion.button>
      )}

      {/* Primary action button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={
          status === "idle" || status === "completed"
            ? onStart
            : status === "running"
              ? onPause
              : onResume
        }
        className="btn btn-primary btn-wide text-lg font-bold h-14"
        aria-label={status === "running" ? "Pause timer" : "Start timer"}
      >
        {status === "idle" && "Start"}
        {status === "running" && "Pause"}
        {status === "paused" && "Resume"}
        {status === "completed" && "Start Next"}
      </motion.button>

      {/* Skip — visible when running or paused */}
      {(status === "running" || status === "paused") && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onSkip}
          className="btn btn-ghost btn-circle"
          aria-label="Skip to next session"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" x2="19" y1="5" y2="19" />
          </svg>
        </motion.button>
      )}
    </div>
  );
}
