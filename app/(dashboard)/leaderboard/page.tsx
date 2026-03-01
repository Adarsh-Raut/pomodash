// app/(dashboard)/leaderboard/page.tsx

export const revalidate = 300;

import type { Metadata } from "next";
import { getLeaderboard } from "@/actions/sessions";
import { formatDuration } from "@/lib/utils";
import { auth } from "@/lib/auth";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Leaderboard",
};

const medals = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const [entries, session] = await Promise.all([getLeaderboard(), auth()]);

  const currentUserEntry = entries.find((e) => e.isCurrentUser);
  const currentUserOnBoard = entries.some((e) => e.isCurrentUser);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-base-content/70 text-sm mt-1">
          Top focus times in the last 7 days
        </p>
      </div>

      {/* Current user summary if not in top 20 */}
      {!currentUserOnBoard && currentUserEntry && (
        <div className="alert bg-base-200 border border-base-300">
          <span className="text-sm text-base-content/70">
            Your rank is not in the top 20 yet. Keep focusing! 💪
          </span>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center py-16">
            {/* <span className="text-5xl">🍅</span> */}
            <Image
              src="/tomato.png"
              alt="Pomodash"
              width={48}
              height={48}
              className="opacity-40"
            />
            <h2 className="card-title mt-4">No data yet</h2>
            <p className="text-base-content/70 text-sm">
              Be the first to complete a focus session!
            </p>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      {entries.length > 0 && (
        <div className="card bg-base-100 shadow overflow-hidden">
          <table className="table">
            <thead>
              <tr className="border-base-300 text-base-content/70 text-xs uppercase tracking-wider">
                <th className="w-12">Rank</th>
                <th>User</th>
                <th className="text-right">Sessions</th>
                <th className="text-right">Focus Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.userId}
                  className={`
                    border-base-300 transition-colors
                    ${
                      entry.isCurrentUser
                        ? "bg-primary/10 font-semibold"
                        : "hover:bg-base-200/50"
                    }
                  `}
                >
                  {/* Rank */}
                  <td className="text-center">
                    {entry.rank <= 3 ? (
                      <span className="text-xl">{medals[entry.rank - 1]}</span>
                    ) : (
                      <span className="text-base-content/70 font-mono text-sm">
                        #{entry.rank}
                      </span>
                    )}
                  </td>

                  {/* User */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-base-300">
                        {entry.image ? (
                          <Image
                            src={entry.image}
                            alt={entry.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary text-primary-content">
                            {entry.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-2 text-xs text-primary font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Sessions */}
                  <td className="text-right">
                    <span className="text-sm tabular-nums">
                      {entry.sessionsCompleted}
                    </span>
                  </td>

                  {/* Focus time */}
                  <td className="text-right">
                    <span className="text-sm font-mono tabular-nums text-primary">
                      {formatDuration(entry.totalFocusTime)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <p className="text-center text-xs text-base-content/50">
        Rankings refresh on every page load · Last 7 days · Completed sessions
        only
      </p>
    </div>
  );
}
