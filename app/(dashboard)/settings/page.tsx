export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { getUserSettings } from "@/actions/settings";
import SettingsLoading from "./loading";
import type { UserSettings } from "@/types";

export const metadata: Metadata = { title: "Settings" };

async function SettingsContent({ settings }: { settings: UserSettings }) {
  const { SettingsForm } = await import("@/components/settings/SettingsForm");
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}

export default async function SettingsPage() {
  const settings = await getUserSettings();
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent settings={settings} />
    </Suspense>
  );
}
