// src/actions/sessions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CreateSessionInput } from "@/types";

// Input validation schema
const createSessionSchema = z.object({
  type: z.enum(["FOCUS", "SHORT_BREAK", "LONG_BREAK"]),
  duration: z.number().int().positive().max(7200),
  completed: z.boolean(),
  notes: z.string().max(500).optional(),
  taskId: z.string().optional(), // add this
});
export async function createSession(input: CreateSessionInput) {
  // Always authenticate in Server Actions — never trust the caller
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Validate input with Zod — never trust client data
  const validated = createSessionSchema.parse(input);

  const pomodoroSession = await prisma.pomodoroSession.create({
    data: {
      userId: session.user.id,
      type: validated.type,
      duration: validated.duration,
      completed: validated.completed,
      completedAt: validated.completed ? new Date() : null,
      notes: validated.notes,
      taskId: validated.taskId, // add this
    },
  });

  if (validated.completed && validated.type === "FOCUS" && validated.taskId) {
    await prisma.task.update({
      where: { id: validated.taskId },
      data: { completedPomodoros: { increment: 1 } },
    });
  }

  // Invalidate the stats pages so they re-fetch fresh data
  revalidatePath("/dashboard");
  revalidatePath("/stats");

  return pomodoroSession;
}

export async function getRecentSessions(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.pomodoroSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getSessionStats(period: "day" | "week" | "month") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { getDateRange } = await import("@/lib/utils");
  const { start, end } = getDateRange(period);

  const sessions = await prisma.pomodoroSession.findMany({
    where: {
      userId: session.user.id,
      startedAt: { gte: start, lte: end },
      type: "FOCUS",
    },
    orderBy: { startedAt: "asc" },
  });

  return sessions;
}

// add this to the bottom of actions/sessions.ts
export async function getLeaderboard() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Aggregate total completed focus time per user — last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const results = await prisma.pomodoroSession.groupBy({
    by: ["userId"],
    where: {
      type: "FOCUS",
      completed: true,
      startedAt: { gte: sevenDaysAgo },
    },
    _sum: { duration: true },
    _count: { id: true },
    orderBy: { _sum: { duration: "desc" } },
    take: 20, // top 20
  });

  // Fetch user info for each result
  const userIds = results.map((r: { userId: string }) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, image: true },
  });

  type LeaderboardUser = {
    id: string;
    name: string | null;
    image: string | null;
  };
  const userMap = new Map<string, LeaderboardUser>(
    users.map((u: LeaderboardUser) => [u.id, u]),
  );
  return results.map((r: (typeof results)[number], index: number) => ({
    rank: index + 1,
    userId: r.userId,
    name: userMap.get(r.userId)?.name ?? "Anonymous",
    image: userMap.get(r.userId)?.image ?? null,
    totalFocusTime: r._sum.duration ?? 0,
    sessionsCompleted: r._count.id,
    isCurrentUser: r.userId === session.user.id,
  }));
}

export async function getSessionsInRange(start: Date, end: Date) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.pomodoroSession.findMany({
    where: {
      userId: session.user.id,
      type: "FOCUS",
      completed: true,
      startedAt: { gte: start, lte: end },
      taskId: { not: null },
    },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { startedAt: "asc" },
  });
}
