// proxy.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/stats") ||
    nextUrl.pathname.startsWith("/settings") ||
    nextUrl.pathname.startsWith("/leaderboard");

  // Redirect old /login to root
  if (nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // Authenticated users visiting landing go straight to dashboard
  if (nextUrl.pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
