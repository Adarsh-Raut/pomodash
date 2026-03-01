// src/components/timer/SessionTypeSelector.tsx
"use client";

import { cn } from "@/lib/utils";
import type { TimerMode } from "@/types";

interface SessionTypeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
  disabled: boolean;
}

const modes: { value: TimerMode; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "short_break", label: "Short Break" },
  { value: "long_break", label: "Long Break" },
];

export function SessionTypeSelector({
  currentMode,
  onModeChange,
  disabled,
}: SessionTypeSelectorProps) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1 bg-base-300 rounded-lg p-1">
        {modes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => !disabled && onModeChange(value)}
            disabled={disabled}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              currentMode === value
                ? "bg-base-100 text-base-content shadow-sm"
                : "text-base-content/70 hover:text-base-content",
              disabled && "cursor-not-allowed opacity-70",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
