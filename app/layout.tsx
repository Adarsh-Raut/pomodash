import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { TimerProvider } from "@/components/providers/TimerProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { template: "%s | Pomodash", default: "Pomodash — Stay Focused" },
  description: "A production-grade Pomodoro timer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <TimerProvider>{children}</TimerProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
