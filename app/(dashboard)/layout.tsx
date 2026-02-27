// src/app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles this, but Server Component layout adds another layer
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar user={session.user} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
