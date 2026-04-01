ALTER TABLE "Task" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Task_userId_deletedAt_completed_createdAt_idx"
ON "Task"("userId", "deletedAt", "completed", "createdAt");
