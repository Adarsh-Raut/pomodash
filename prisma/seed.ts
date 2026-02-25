// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Fake users ────────────────────────────────────────────────────────────
  const fakeUsers = [
    { name: "Alice Chen", email: "alice@example.com" },
    { name: "Bob Martinez", email: "bob@example.com" },
    { name: "Priya Sharma", email: "priya@example.com" },
    { name: "James Wilson", email: "james@example.com" },
    { name: "Yuki Tanaka", email: "yuki@example.com" },
  ];

  const createdUsers: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];

  for (const u of fakeUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        settings: { create: {} },
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ User: ${user.name}`);
  }

  // Also grab your real account
  const realUsers = await prisma.user.findMany({
    where: { email: { notIn: fakeUsers.map((u) => u.email) } },
  });

  const allUsers = [...createdUsers, ...realUsers];

  // ── Tasks + Sessions per user ─────────────────────────────────────────────
  const taskTemplates = [
    {
      title: "Build authentication system",
      estimated: 6,
      daysWorked: [6, 5, 4],
      pomosPerDay: [3, 2, 1],
    },
    {
      title: "Write unit tests",
      estimated: 4,
      daysWorked: [4, 3],
      pomosPerDay: [2, 2],
    },
    {
      title: "Design database schema",
      estimated: 3,
      daysWorked: [6, 5],
      pomosPerDay: [2, 1],
    },
    {
      title: "Fix production bugs",
      estimated: 5,
      daysWorked: [3, 2, 1],
      pomosPerDay: [2, 2, 1],
    },
    {
      title: "Refactor API layer",
      estimated: 8,
      daysWorked: [5, 4, 3, 2],
      pomosPerDay: [2, 2, 2, 2],
    },
    {
      title: "Update documentation",
      estimated: 2,
      daysWorked: [2],
      pomosPerDay: [2],
    },
    {
      title: "Code review and feedback",
      estimated: 3,
      daysWorked: [1, 0],
      pomosPerDay: [2, 1],
    },
    {
      title: "Performance optimization",
      estimated: 6,
      daysWorked: [4, 3, 2],
      pomosPerDay: [2, 2, 2],
    },
  ];

  for (const user of allUsers) {
    // Clear old seeded data
    await prisma.pomodoroSession.deleteMany({
      where: { userId: user.id, startedAt: { gte: daysAgo(8) } },
    });
    await prisma.task.deleteMany({ where: { userId: user.id } });

    // Pick 3–5 tasks per user randomly
    const userTasks = [...taskTemplates]
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(3, 5));

    for (const [taskIndex, template] of userTasks.entries()) {
      let completedPomodoros = 0;
      const allSessionData: {
        userId: string;
        taskId: string;
        type: "FOCUS" | "SHORT_BREAK";
        duration: number;
        completed: boolean;
        startedAt: Date;
        completedAt: Date;
      }[] = [];

      // Pre-calculate sessions so we know completedPomodoros
      for (let di = 0; di < template.daysWorked.length; di++) {
        const day = template.daysWorked[di];
        const pomos = template.pomosPerDay[di];
        const startHour = 9 + taskIndex * 1.5;

        for (let p = 0; p < pomos; p++) {
          const startedAt = daysAgo(day, Math.floor(startHour) + p, p * 5);
          const focusEnd = new Date(startedAt.getTime() + 25 * 60 * 1000);
          const breakStart = new Date(focusEnd);
          const breakEnd = new Date(breakStart.getTime() + 5 * 60 * 1000);

          allSessionData.push({
            userId: user.id,
            taskId: "", // fill after task creation
            type: "FOCUS",
            duration: 1500,
            completed: true,
            startedAt,
            completedAt: focusEnd,
          });

          allSessionData.push({
            userId: user.id,
            taskId: "",
            type: "SHORT_BREAK",
            duration: 300,
            completed: true,
            startedAt: breakStart,
            completedAt: breakEnd,
          });

          completedPomodoros++;
        }
      }

      const focusCount = allSessionData.filter(
        (s) => s.type === "FOCUS",
      ).length;

      // Create task with accurate completedPomodoros
      const task = await prisma.task.create({
        data: {
          userId: user.id,
          title: template.title,
          estimatedPomodoros: template.estimated,
          completedPomodoros: focusCount,
          completed: focusCount >= template.estimated,
          order: taskIndex,
        },
      });

      // Fill taskId and insert sessions
      const sessions = allSessionData.map((s) => ({ ...s, taskId: task.id }));
      await prisma.pomodoroSession.createMany({ data: sessions });

      console.log(
        `    📋 ${user.name} — "${task.title}" (${focusCount}/${template.estimated} pomodoros)`,
      );
    }

    // Also seed some leaderboard sessions not tied to tasks (older activity)
    const leaderboardSessions: {
      userId: string;
      taskId: null;
      type: "FOCUS";
      duration: number;
      completed: boolean;
      startedAt: Date;
      completedAt: Date;
    }[] = [];
    for (let day = 7; day >= 1; day--) {
      const dailyPomos = randomInt(3, 9);
      for (let p = 0; p < dailyPomos; p++) {
        const startedAt = daysAgo(day, 9 + p, 0);
        const completedAt = new Date(startedAt.getTime() + 25 * 60 * 1000);
        leaderboardSessions.push({
          userId: user.id,
          taskId: null,
          type: "FOCUS" as const,
          duration: 1500,
          completed: true,
          startedAt,
          completedAt,
        });
      }
    }
    await prisma.pomodoroSession.createMany({ data: leaderboardSessions });

    console.log(`  ✓ ${user.name} seeded`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalSessions = await prisma.pomodoroSession.count();
  const totalTasks = await prisma.task.count();
  console.log(`\n✅ Done!`);
  console.log(`   Users:    ${allUsers.length}`);
  console.log(`   Tasks:    ${totalTasks}`);
  console.log(`   Sessions: ${totalSessions}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
