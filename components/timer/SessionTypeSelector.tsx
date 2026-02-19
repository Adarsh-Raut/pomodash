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
      <div className="tabs tabs-boxed bg-base-200">
        {modes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => !disabled && onModeChange(value)}
            className={cn(
              "tab transition-all duration-200",
              currentMode === value && "tab-active",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            disabled={disabled}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
