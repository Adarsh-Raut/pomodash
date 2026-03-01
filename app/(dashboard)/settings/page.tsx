export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { getUserSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/SettingsForm";
import SettingsLoading from "./loading";

export const metadata: Metadata = { title: "Settings" };

async function SettingsContent() {
  const settings = await getUserSettings();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
