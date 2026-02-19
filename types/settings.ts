// src/types/settings.ts
export interface UserSettings {
  id: string;
  userId: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  dailyGoal: number;
}

export type UpdateSettingsInput = Partial<Omit<UserSettings, "id" | "userId">>;
