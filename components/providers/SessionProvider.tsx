// src/components/providers/SessionProvider.tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

// This is a thin wrapper — we keep it here so the root layout stays clean
// and we have a place to add props if needed later
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Refetch session every hour in case it was invalidated server-side
      refetchInterval={60 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
