// src/app/(auth)/login/page.tsx
import type { Metadata } from "next";
import { LoginCard } from "@/components/auth/LoginCard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign In",
};

// This is a Server Component — we can check auth server-side
// and redirect before sending anything to the client
export default async function LoginPage() {
  const session = await auth();

  // Double-check — middleware should catch this, but defense in depth
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <LoginCard />
    </main>
  );
}
