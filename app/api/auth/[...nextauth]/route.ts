// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

// NextAuth v5 exports handlers directly — clean and simple
export const { GET, POST } = handlers;
