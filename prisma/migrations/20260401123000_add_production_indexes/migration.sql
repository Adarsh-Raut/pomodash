-- Helps leaderboard scans over recent completed focus sessions grouped by user.
CREATE INDEX "PomodoroSession_type_completed_startedAt_userId_idx"
ON "PomodoroSession"("type", "completed", "startedAt", "userId");

-- Helps task list reads that filter by user/completed and sort by order/createdAt.
CREATE INDEX "Task_userId_completed_order_createdAt_idx"
ON "Task"("userId", "completed", "order", "createdAt");
