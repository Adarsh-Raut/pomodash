export type StatsPeriod = "week" | "month" | "year";

export function getStatsDateRange(period: StatsPeriod, offset: number) {
  const now = new Date();
  const startOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  };
  const endOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(23, 59, 59, 999);
    return next;
  };

  if (period === "week") {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek - offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: startOfDay(monday),
      end: endOfDay(sunday),
      label:
        offset === 0
          ? "This Week"
          : offset === 1
            ? "Last Week"
            : `${monday.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })} – ${sunday.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}`,
    };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    return {
      start: startOfDay(start),
      end: endOfDay(end),
      label:
        offset === 0
          ? "This Month"
          : offset === 1
            ? "Last Month"
            : start.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              }),
    };
  }

  const year = now.getFullYear() - offset;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return {
    start: startOfDay(start),
    end: endOfDay(end),
    label:
      offset === 0 ? "This Year" : offset === 1 ? "Last Year" : String(year),
  };
}
