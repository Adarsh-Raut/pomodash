export const revalidate = 60;

import type { Metadata } from "next";
import { Suspense } from "react";
import { getStatsSnapshot } from "@/actions/sessions";
import { StatsShell } from "@/components/stats/StatsShell";
import StatsLoading from "./loading";

export const metadata: Metadata = { title: "Stats" };

async function StatsContent() {
  const initialSnapshot = await getStatsSnapshot("week", 0);

  return <StatsShell initialSnapshot={initialSnapshot} />;
}

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsLoading />}>
      <StatsContent />
    </Suspense>
  );
}
