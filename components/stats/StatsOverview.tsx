// components/stats/StatsOverview.tsx
import { auth } from "@/lib/auth";
import { getSessionStats } from "@/actions/sessions";
import { formatDuration } from "@/lib/utils";

export async function StatsOverview({ userId }: { userId: string }) {
  const sessions = await getSessionStats("day");

  const completed = sessions.filter((s) => s.completed);
  const totalFocusTime = completed.reduce((acc, s) => acc + s.duration, 0);
  const totalSessions = sessions.length;

  const stats = [
    {
      label: "Today's Focus",
      value: formatDuration(totalFocusTime),
      color: "text-primary",
    },
    {
      label: "Completed",
      value: completed.length.toString(),
      color: "text-secondary",
    },
    {
      label: "Total Sessions",
      value: totalSessions.toString(),
      color: "text-accent",
    },
  ];

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h3 className="card-title text-base">Today</h3>
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-base-content/50 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
