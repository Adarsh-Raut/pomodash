// src/app/(dashboard)/settings/page.tsx

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getUserSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getUserSettings();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
