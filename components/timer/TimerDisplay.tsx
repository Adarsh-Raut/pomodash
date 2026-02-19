// src/components/timer/TimerDisplay.tsx
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
  const progress = timeRemaining / totalDuration;
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
        {/* SVG circular progress */}
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
          {/* Progress */}
          <motion.circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            className={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        {/* Time display centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={Math.floor(timeRemaining / 60)} // Re-animate on minute change
            initial={{ scale: 1.1, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-bold tabular-nums text-base-content"
          >
            {formatTime(timeRemaining)}
          </motion.span>
          <span className="text-sm text-base-content/50 mt-1">
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
