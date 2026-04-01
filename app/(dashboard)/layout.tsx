import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { TimerProvider } from "@/components/providers/TimerProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar user={session.user} />
      <TimerProvider>
        <main className="container mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </TimerProvider>
    </div>
  );
}
