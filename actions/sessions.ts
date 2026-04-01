// src/actions/sessions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CreateSessionInput } from "@/types";
import { unstable_cache } from "next/cache";
import { getDateRange } from "@/lib/utils";

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
    select: {
      id: true,
      userId: true,
      type: true,
      duration: true,
      completed: true,
      startedAt: true,
      completedAt: true,
      notes: true,
      task: { select: { id: true, title: true } },
    },
  });
}

export async function getSessionStats(period: "day" | "week" | "month") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { start, end } = getDateRange(period);
  const userId = session.user.id;

  return unstable_cache(
    async () => {
      return prisma.pomodoroSession.findMany({
        where: {
          userId,
          startedAt: { gte: start, lte: end },
          type: "FOCUS",
        },
        orderBy: { startedAt: "asc" },
      });
    },
    [`sessions-${userId}-${period}`],
    { revalidate: 60, tags: [`sessions-${userId}`] },
  )();
}
// add this to the bottom of actions/sessions.ts
export async function getLeaderboard() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  return unstable_cache(
    async () => {
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
        take: 20,
      });

      const userIds = results.map((r: (typeof results)[number]) => r.userId);
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
        isCurrentUser: r.userId === userId,
      }));
    },
    [`leaderboard-${userId}`],
    { revalidate: 300, tags: ["leaderboard"] },
  )();
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

export type ChartBucket = { date: string; dateObj: Date };
export type ChartTask = { id: string; title: string };
export type ChartDataPoint = { date: string; [key: string]: string | number };
export type ChartData = {
  buckets: ChartBucket[];
  tasks: ChartTask[];
  data: ChartDataPoint[];
};

function getChartDateRange(
  period: "week" | "month" | "year",
  offset: number
): { start: Date; end: Date; buckets: ChartBucket[] } {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  };
  const endOfDay = (d: Date) => {
    const c = new Date(d);
    c.setHours(23, 59, 59, 999);
    return c;
  };

  if (period === "week") {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek - offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        dateObj: startOfDay(d),
        date:
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
          ` (${d.toLocaleDateString("en-US", { weekday: "short" })})`,
      };
    });
    return { start: startOfDay(monday), end: endOfDay(sunday), buckets };
  }

  if (period === "month") {
    const year = now.getFullYear();
    const month = now.getMonth() - offset;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const buckets = Array.from({ length: end.getDate() }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return {
        dateObj: startOfDay(d),
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });
    return { start: startOfDay(start), end: endOfDay(end), buckets };
  }

  const year = now.getFullYear() - offset;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const buckets = Array.from({ length: 12 }, (_, m) => {
    const d = new Date(year, m, 1);
    return {
      dateObj: startOfDay(d),
      date: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });
  return { start: startOfDay(start), end: endOfDay(end), buckets };
}

export async function getChartData(
  period: "week" | "month" | "year",
  offset: number
): Promise<ChartData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { start, end, buckets } = getChartDateRange(period, offset);

  const sessions = await prisma.pomodoroSession.findMany({
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

  const taskMap = new Map<string, { id: string; title: string }>();
  sessions.forEach((s) => {
    if (s.task) taskMap.set(s.task.id, s.task);
  });
  const tasks = Array.from(taskMap.values());

  const data: ChartDataPoint[] = buckets.map(({ date, dateObj }) => {
    const row: ChartDataPoint = { date };
    tasks.forEach((task) => {
      let secs = 0;
      if (period === "year") {
        secs = sessions
          .filter(
            (s) =>
              s.taskId === task.id &&
              new Date(s.startedAt).getMonth() === dateObj.getMonth() &&
              new Date(s.startedAt).getFullYear() === dateObj.getFullYear()
          )
          .reduce((acc, s) => acc + s.duration, 0);
      } else {
        secs = sessions
          .filter(
            (s) =>
              s.taskId === task.id &&
              new Date(s.startedAt).toDateString() === dateObj.toDateString()
          )
          .reduce((acc, s) => acc + s.duration, 0);
      }
      row[task.id] = Math.round(secs / 60);
    });
    return row;
  });

  return { buckets, tasks, data };
}
