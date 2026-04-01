import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const partialSessionSchema = z.object({
  type: z.enum(["FOCUS", "SHORT_BREAK", "LONG_BREAK"]),
  duration: z.number().int().positive().max(7200),
  completed: z.literal(false),
  taskId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const parsed = partialSessionSchema.safeParse(parsedBody);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;
  let taskId: string | undefined;

  if (data.taskId && data.type === "FOCUS") {
    const task = await prisma.task.findFirst({
      where: { id: data.taskId, userId: session.user.id, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    taskId = task.id;
  }

  await prisma.pomodoroSession.create({
    data: {
      userId: session.user.id,
      type: data.type,
      duration: data.duration,
      completed: false,
      taskId,
    },
  });

  return NextResponse.json({ ok: true });
}
