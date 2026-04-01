// src/actions/sessions.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CreateSessionInput } from "@/types";
import { unstable_cache } from "next/cache";
import { getDateRange } from "@/lib/utils";
import { getStatsDateRange, type StatsPeriod } from "@/lib/stats";
import { getTaskStats } from "./tasks";

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

  const pomodoroSession = await prisma.$transaction(async (tx) => {
    let safeTaskId: string | undefined;

    if (validated.taskId && validated.type === "FOCUS") {
      const task = await tx.task.findFirst({
        where: {
          id: validated.taskId,
          userId: session.user.id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      safeTaskId = task.id;
    }

    if (validated.completed && validated.type === "FOCUS" && safeTaskId) {
      await tx.task.update({
        where: { id: safeTaskId, userId: session.user.id },
        data: { completedPomodoros: { increment: 1 } },
      });
    }

    return tx.pomodoroSession.create({
      data: {
        userId: session.user.id,
        type: validated.type,
        duration: validated.duration,
        completed: validated.completed,
        completedAt: validated.completed ? new Date() : null,
        notes: validated.notes,
        taskId: safeTaskId,
      },
    });
  });

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
        select: {
          completed: true,
          duration: true,
          startedAt: true,
        },
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
    select: {
      taskId: true,
      duration: true,
      startedAt: true,
      task: { select: { id: true, title: true } },
    },
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

function getChartTaskKey(taskId: string, completed: boolean) {
  return completed ? taskId : `${taskId}__partial`;
}

function getChartTaskTitle(title: string, completed: boolean) {
  return completed ? title : `${title} (partial)`;
}

function getChartDateRange(
  period: StatsPeriod,
  offset: number
): { start: Date; end: Date; buckets: ChartBucket[] } {
  const { start, end } = getStatsDateRange(period, offset);
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
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        dateObj: startOfDay(d),
        date:
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
          ` (${d.toLocaleDateString("en-US", { weekday: "short" })})`,
      };
    });
    return { start, end, buckets };
  }

  if (period === "month") {
    const buckets = Array.from({ length: end.getDate() }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), i + 1);
      return {
        dateObj: startOfDay(d),
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    });
    return { start: startOfDay(start), end: endOfDay(end), buckets };
  }

  const buckets = Array.from({ length: 12 }, (_, m) => {
    const d = new Date(start.getFullYear(), m, 1);
    return {
      dateObj: startOfDay(d),
      date: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });
  return { start: startOfDay(start), end: endOfDay(end), buckets };
}

export async function getChartData(
  period: StatsPeriod,
  offset: number
): Promise<ChartData> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { start, end, buckets } = getChartDateRange(period, offset);

  const sessions = await prisma.pomodoroSession.findMany({
    where: {
      userId: session.user.id,
      type: "FOCUS",
      startedAt: { gte: start, lte: end },
      taskId: { not: null },
    },
    select: {
      taskId: true,
      duration: true,
      completed: true,
      startedAt: true,
      task: { select: { id: true, title: true } },
    },
    orderBy: { startedAt: "asc" },
  });

  const taskMap = new Map<
    string,
    { id: string; title: string; latestStartedAt: number }
  >();
  sessions.forEach((s) => {
    if (!s.task || !s.taskId) return;

    const chartTaskId = getChartTaskKey(s.taskId, s.completed);
    const latestStartedAt = new Date(s.startedAt).getTime();
    const existing = taskMap.get(chartTaskId);

    taskMap.set(chartTaskId, {
      id: chartTaskId,
      title: getChartTaskTitle(s.task.title, s.completed),
      latestStartedAt: existing
        ? Math.max(existing.latestStartedAt, latestStartedAt)
        : latestStartedAt,
    });
  });
  const tasks = Array.from(taskMap.values())
    .sort((a, b) => a.latestStartedAt - b.latestStartedAt)
    .map(({ id, title }) => ({ id, title }));

  const bucketKeyToIndex = new Map<string, number>();
  buckets.forEach(({ dateObj }, index) => {
    const key =
      period === "year"
        ? `${dateObj.getFullYear()}-${dateObj.getMonth()}`
        : dateObj.toDateString();
    bucketKeyToIndex.set(key, index);
  });

  const data: ChartDataPoint[] = buckets.map(({ date }) => {
    const row: ChartDataPoint = { date };
    tasks.forEach((task) => {
      row[task.id] = 0;
    });
    return row;
  });

  sessions.forEach((session) => {
    if (!session.taskId) return;

    const startedAt = new Date(session.startedAt);
    const bucketKey =
      period === "year"
        ? `${startedAt.getFullYear()}-${startedAt.getMonth()}`
        : startedAt.toDateString();
    const bucketIndex = bucketKeyToIndex.get(bucketKey);
    const chartTaskId = getChartTaskKey(session.taskId, session.completed);

    if (bucketIndex === undefined) return;

    const currentValue = data[bucketIndex][chartTaskId];
    data[bucketIndex][chartTaskId] =
      typeof currentValue === "number"
        ? currentValue + session.duration / 60
        : session.duration / 60;
  });

  data.forEach((row) => {
    tasks.forEach((task) => {
      row[task.id] = Math.round((row[task.id] as number) || 0);
    });
  });

  return { buckets, tasks, data };
}

function calculateStreaks(sessions: { startedAt: Date; completed: boolean }[]) {
  const completedDays = new Set(
    sessions
      .filter((session) => session.completed)
      .map((session) => new Date(session.startedAt).toDateString()),
  );

  let currentStreak = 0;
  const checking = new Date();
  for (let i = 0; i < 365; i++) {
    if (completedDays.has(checking.toDateString())) {
      currentStreak++;
      checking.setDate(checking.getDate() - 1);
    } else if (i === 0) {
      checking.setDate(checking.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDays = Array.from(completedDays)
    .map((day) => new Date(day))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let temp = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) temp = 1;
    else {
      const diff =
        (sortedDays[i].getTime() - sortedDays[i - 1].getTime()) / 86400000;
      temp = diff === 1 ? temp + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, temp);
  }

  return { currentStreak, longestStreak };
}

export async function getStatsSnapshot(period: StatsPeriod, offset: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { start, end, label } = getStatsDateRange(period, offset);

  const [rangeSessions, allFocusSessions, taskStats, chartData] = await Promise.all([
    prisma.pomodoroSession.findMany({
      where: {
        userId: session.user.id,
        type: "FOCUS",
        startedAt: { gte: start, lte: end },
      },
      orderBy: { startedAt: "asc" },
      select: {
        completed: true,
        duration: true,
        startedAt: true,
      },
    }),
    prisma.pomodoroSession.findMany({
      where: {
        userId: session.user.id,
        type: "FOCUS",
      },
      orderBy: { startedAt: "asc" },
      select: {
        completed: true,
        startedAt: true,
      },
    }),
    getTaskStats(period, offset),
    getChartData(period, offset),
  ]);

  const completedSessions = rangeSessions.filter((item) => item.completed);
  const totalFocusTime = completedSessions.reduce(
    (sum, item) => sum + item.duration,
    0,
  );
  const partialFocusTime = rangeSessions
    .filter((item) => !item.completed)
    .reduce((sum, item) => sum + item.duration, 0);
  const { currentStreak, longestStreak } = calculateStreaks(allFocusSessions);

  return {
    period,
    offset,
    label,
    cards: {
      label,
      totalFocusTime,
      partialFocusTime,
      completedSessions: completedSessions.length,
      currentStreak,
      longestStreak,
      tasksTracked: taskStats.length,
      tasksCompleted: taskStats.filter((task) => task.completed).length,
    },
    taskStats,
    chartData,
  };
}
