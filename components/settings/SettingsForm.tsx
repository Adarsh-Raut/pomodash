// components/settings/SettingsForm.tsx
"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/actions/settings";
import type { UserSettings } from "@/types";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  settings: UserSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [values, setValues] = useState(settings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateSettings({
        focusDuration: values.focusDuration,
        shortBreakDuration: values.shortBreakDuration,
        longBreakDuration: values.longBreakDuration,
        longBreakInterval: values.longBreakInterval,
        autoStartBreaks: values.autoStartBreaks,
        autoStartFocus: values.autoStartFocus,
        soundEnabled: values.soundEnabled,
        soundVolume: values.soundVolume,
        dailyGoal: values.dailyGoal,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  // Number input for minutes — converts to/from seconds internally
  const MinuteInput = ({
    label,
    field,
    min,
    max,
    hint,
  }: {
    label: string;
    field: keyof UserSettings;
    min: number;
    max: number;
    hint?: string;
  }) => {
    const valueInSeconds = values[field] as number;
    const [raw, setRaw] = useState(String(Math.round(valueInSeconds / 60)));

    return (
      <div className="form-control gap-1.5">
        <label className="label py-0">
          <span className="label-text font-medium">{label}</span>
          {hint && (
            <span className="label-text-alt text-base-content/40">{hint}</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min}
            max={max}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => {
              const mins = Math.min(max, Math.max(min, Number(raw) || min));
              setRaw(String(mins));
              setValues((v) => ({ ...v, [field]: mins * 60 }));
            }}
            className="input input-bordered w-24 text-center font-mono text-lg"
          />
          <span className="text-sm text-base-content/50">minutes</span>
        </div>
      </div>
    );
  };

  // Number input for plain integers (e.g. long break interval)
  const CountInput = ({
    label,
    field,
    min,
    max,
    unit,
    hint,
  }: {
    label: string;
    field: keyof UserSettings;
    min: number;
    max: number;
    unit: string;
    hint?: string;
  }) => {
    const [raw, setRaw] = useState(String(values[field] as number));

    return (
      <div className="form-control gap-1.5">
        <label className="label py-0">
          <span className="label-text font-medium">{label}</span>
          {hint && (
            <span className="label-text-alt text-base-content/40">{hint}</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min}
            max={max}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => {
              const val = Math.min(max, Math.max(min, Number(raw) || min));
              setRaw(String(val));
              setValues((v) => ({ ...v, [field]: val }));
            }}
            className="input input-bordered w-24 text-center font-mono text-lg"
          />
          <span className="text-sm text-base-content/50">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Timer Durations */}
      <div className="card bg-base-100 shadow">
        <div className="card-body gap-6">
          <h2 className="card-title text-base">Timer Durations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MinuteInput
              label="Focus"
              field="focusDuration"
              min={1}
              max={120}
              hint="5–60 min recommended"
            />
            <MinuteInput
              label="Short Break"
              field="shortBreakDuration"
              min={1}
              max={30}
              hint="3–10 min recommended"
            />
            <MinuteInput
              label="Long Break"
              field="longBreakDuration"
              min={1}
              max={60}
              hint="15–30 min recommended"
            />
            <CountInput
              label="Long Break Every"
              field="longBreakInterval"
              min={2}
              max={10}
              unit="pomodoros"
              hint="Default: 4"
            />
          </div>
        </div>
      </div>

      {/* Behavior toggles */}
      <div className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <h2 className="card-title text-base">Behavior</h2>
          {[
            { field: "autoStartBreaks" as const, label: "Auto-start breaks" },
            {
              field: "autoStartFocus" as const,
              label: "Auto-start focus sessions",
            },
            { field: "soundEnabled" as const, label: "Sound notifications" },
          ].map(({ field, label }) => (
            <div key={field} className="form-control">
              <label className="label cursor-pointer justify-start gap-4 py-1">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={values[field] as boolean}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field]: e.target.checked }))
                  }
                />
                <span className="label-text">{label}</span>
              </label>
            </div>
          ))}

          {/* Volume slider — only shown when sound is enabled */}
          {values.soundEnabled && (
            <div className="form-control gap-2 pl-2">
              <div className="flex items-center justify-between">
                <label className="label-text font-medium text-sm">Volume</label>
                <span className="text-sm font-mono text-primary">
                  {values.soundVolume}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-base-content/40 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={values.soundVolume}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      soundVolume: Number(e.target.value),
                    }))
                  }
                  className="range range-primary range-sm flex-1"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-base-content/40 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className={cn("btn btn-primary w-full", saved && "btn-success")}
      >
        {isPending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : saved ? (
          "Saved ✓"
        ) : (
          "Save Settings"
        )}
      </button>
    </div>
  );
}
