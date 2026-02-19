// actions/settings.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSettingsSchema = z.object({
  focusDuration: z.number().int().min(60).max(7200).optional(),
  shortBreakDuration: z.number().int().min(60).max(3600).optional(),
  longBreakDuration: z.number().int().min(60).max(7200).optional(),
  longBreakInterval: z.number().int().min(1).max(10).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartFocus: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  soundVolume: z.number().int().min(0).max(100).optional(),
  dailyGoal: z.number().int().min(1).max(20).optional(),
});

export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // upsert — create with defaults if doesn't exist, return if it does
  const settings = await prisma.settings.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  });

  return settings;
}

export async function updateSettings(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = updateSettingsSchema.parse(input);

  const settings = await prisma.settings.update({
    where: { userId: session.user.id },
    data: validated,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return settings;
}
