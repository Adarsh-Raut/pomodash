"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navLinks = [
  { href: "/dashboard", label: "Timer" },
  { href: "/stats", label: "Stats" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const preferred = saved ?? "dark";
    setTheme(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <nav className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-3 items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl">🍅</span>
              <span className="font-bold text-base tracking-tight">
                Pomodash
              </span>
            </Link>
          </div>

          {/* Nav links — desktop only */}
          <div className="hidden sm:flex items-center justify-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-content"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-200",
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center justify-end gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              )}
            </button>

            {/* Avatar dropdown — desktop only */}
            <div className="hidden sm:block dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="cursor-pointer rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100 overflow-hidden w-8 h-8 shrink-0"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-xs font-bold">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content mt-2 z-[100] shadow-xl bg-base-100 border border-base-300 rounded-xl w-52 overflow-hidden"
              >
                <li className="px-4 py-3 border-b border-base-300 pointer-events-none">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-base-content/40 truncate mt-0.5">
                    {user.email}
                  </p>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors"
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </div>

            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="sm:hidden border-t border-base-300 bg-base-100">
          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300">
            <div className="rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100 overflow-hidden w-8 h-8 shrink-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-base-content/40 truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Nav links */}
          <div className="px-3 py-2 space-y-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-content"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-200",
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="px-3 py-2 border-t border-base-300">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-error hover:bg-error/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
