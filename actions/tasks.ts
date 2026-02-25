// actions/tasks.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    where: { userId: session.user.id, completed: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getCompletedTasks() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.task.findMany({
    where: { userId: session.user.id, completed: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}

export async function createTask(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validated = createTaskSchema.parse(input);

  // Place new task at the end
  const lastTask = await prisma.task.findFirst({
    where: { userId: session.user.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      title: validated.title,
      description: validated.description,
      estimatedPomodoros: validated.estimatedPomodoros,
      order: (lastTask?.order ?? 0) + 1,
    },
  });

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

  await prisma.task.delete({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/dashboard");
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

export async function getTaskStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    include: {
      sessions: {
        where: {
          type: "FOCUS",
          completed: true,
          startedAt: { gte: sevenDaysAgo },
        },
        select: { duration: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tasks
    .map((task) => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      estimatedPomodoros: task.estimatedPomodoros,
      completedPomodoros: task.completedPomodoros,
      totalFocusTime: task.sessions.reduce(
        (acc: number, s: { duration: number }) => acc + s.duration,
        0,
      ),
      sessionCount: task.sessions.length,
    }))
    .filter((t: { totalFocusTime: number }) => t.totalFocusTime > 0);
}
