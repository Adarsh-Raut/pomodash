// actions/tasks.ts
"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStatsDateRange, type StatsPeriod } from "@/lib/stats";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  estimatedPomodoros: z.number().int().min(1).max(20).default(1),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  estimatedPomodoros: z.number().int().min(1).max(20).optional(),
  completed: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function getTasks() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.task.findMany({
    where: { userId: session.user.id, completed: false, deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { order: "desc" }],
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      completed: true,
      deletedAt: true,
      order: true,
      estimatedPomodoros: true,
      completedPomodoros: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getCompletedTasks() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.task.findMany({
    where: { userId: session.user.id, completed: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      userId: true,
      title: true,
      completed: true,
      deletedAt: true,
      estimatedPomodoros: true,
      completedPomodoros: true,
      updatedAt: true,
    },
  });
}

export async function createTask(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = createTaskSchema.parse(input);

  const task = await prisma.$transaction(
    async (tx) => {
      const lastTask = await tx.task.findFirst({
        where: { userId: session.user.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      return tx.task.create({
        data: {
          userId: session.user.id,
          title: validated.title,
          description: validated.description,
          estimatedPomodoros: validated.estimatedPomodoros,
          order: (lastTask?.order ?? 0) + 1,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  revalidatePath("/dashboard");
  return task;
}

export async function updateTask(id: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = updateTaskSchema.parse(input);

  const task = await prisma.task.update({
    where: { id, userId: session.user.id },
    data: validated,
  });

  revalidatePath("/dashboard");
  return task;
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id, userId: session.user.id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function incrementTaskPomodoro(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.task.update({
    where: { id: taskId, userId: session.user.id },
    data: { completedPomodoros: { increment: 1 } },
  });

  revalidatePath("/dashboard");
}

export async function getTaskStats(
  period: StatsPeriod = "week",
  offset = 0,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { start, end } = getStatsDateRange(period, offset);

  const sessionStats = await prisma.pomodoroSession.groupBy({
    by: ["taskId", "completed"],
    where: {
      userId: session.user.id,
      taskId: { not: null },
      type: "FOCUS",
      startedAt: { gte: start, lte: end },
    },
    _sum: { duration: true },
    _count: { id: true },
  });

  const taskIds = sessionStats
    .map((stat) => stat.taskId)
    .filter((taskId): taskId is string => taskId !== null);

  if (taskIds.length === 0) {
    return [];
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id, id: { in: taskIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      completed: true,
      deletedAt: true,
      estimatedPomodoros: true,
      completedPomodoros: true,
    },
  });

  const statsByTaskId = new Map<
    string,
    { totalFocusTime: number; sessionCount: number; hasCompleted: boolean; hasPartial: boolean }
  >();

  sessionStats.forEach((stat) => {
    if (!stat.taskId) return;

    const current = statsByTaskId.get(stat.taskId) ?? {
      totalFocusTime: 0,
      sessionCount: 0,
      hasCompleted: false,
      hasPartial: false,
    };

    current.totalFocusTime += stat._sum.duration ?? 0;
    current.sessionCount += stat._count.id;
    current.hasCompleted = current.hasCompleted || stat.completed;
    current.hasPartial = current.hasPartial || !stat.completed;

    statsByTaskId.set(stat.taskId, current);
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    isArchived: task.deletedAt !== null,
    estimatedPomodoros: task.estimatedPomodoros,
    completedPomodoros: task.completedPomodoros,
    totalFocusTime: statsByTaskId.get(task.id)?.totalFocusTime ?? 0,
    sessionCount: statsByTaskId.get(task.id)?.sessionCount ?? 0,
    isPartialOnly:
      (statsByTaskId.get(task.id)?.hasCompleted ?? false) === false &&
      (statsByTaskId.get(task.id)?.hasPartial ?? false),
  }));
}
