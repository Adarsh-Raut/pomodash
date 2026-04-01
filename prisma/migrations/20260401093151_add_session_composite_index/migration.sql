-- CreateIndex
CREATE INDEX "PomodoroSession_userId_type_completed_startedAt_idx" ON "PomodoroSession"("userId", "type", "completed", "startedAt");
