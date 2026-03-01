// components/stats/RecentSessions.tsx
import { formatDuration } from "@/lib/utils";
import type { PomodoroSessionData } from "@/types";

interface RecentSessionsProps {
  sessions: PomodoroSessionData[];
}

const sessionLabels = {
  FOCUS: { label: "Focus", color: "badge-primary" },
  SHORT_BREAK: { label: "Short Break", color: "badge-secondary" },
  LONG_BREAK: { label: "Long Break", color: "badge-accent" },
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  if (!sessions.length) {
    return (
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">Recent Sessions</h3>
          <p className="text-sm text-base-content/70">
            No sessions yet. Start your first pomodoro!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body gap-3">
        <h3 className="card-title text-base">Recent Sessions</h3>
        <ul className="space-y-2">
          {sessions.map((session) => {
            const config = sessionLabels[session.type];
            return (
              <li
                key={session.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={`badge badge-sm ${config.color}`}>
                    {config.label}
                  </span>
                  {session.completed ? (
                    <span className="text-success text-xs">✓</span>
                  ) : (
                    <span className="text-base-content/50 text-xs">—</span>
                  )}
                </div>
                <span className="text-base-content/70 font-mono">
                  {formatDuration(session.duration)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
