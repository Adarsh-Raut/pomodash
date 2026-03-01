"use client";

import { motion } from "framer-motion";
import { formatTime } from "@/lib/utils";
import type { TimerStatus, TimerMode } from "@/types";

interface TimerDisplayProps {
  timeRemaining: number;
  totalDuration: number;
  status: TimerStatus;
  mode: TimerMode;
}

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerDisplay({
  timeRemaining,
  totalDuration,
  status,
  mode,
}: TimerDisplayProps) {
  // Guard against division by zero or mismatched state on first render
  const safeTotal = totalDuration > 0 ? totalDuration : 1;
  const safeRemaining = Math.min(timeRemaining, safeTotal);
  const progress = safeRemaining / safeTotal;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const strokeColor =
    mode === "focus"
      ? "stroke-primary"
      : mode === "short_break"
        ? "stroke-secondary"
        : "stroke-accent";

  return (
    <div className="flex justify-center">
      <div className="relative w-56 h-56">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            className="stroke-base-300"
            strokeWidth="8"
          />
          {/* Progress — no animation on first render, only animate when running */}
          <motion.circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            className={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            animate={{ strokeDashoffset }}
            transition={
              status === "running"
                ? { duration: 0.5, ease: "linear" }
                : { duration: 0 } // instant update when idle/paused — no flash
            }
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tabular-nums text-base-content">
            {formatTime(timeRemaining)}
          </span>
          <span className="text-sm text-base-content/70 mt-1">
            {status === "running"
              ? "focusing..."
              : status === "paused"
                ? "paused"
                : status === "completed"
                  ? "done!"
                  : "ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
