"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Menu, Moon, Settings, Sun, LogOut, X } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    const next = current === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  };

  return (
    <nav className="bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-3 items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
            >
              {/* <span className="text-xl">🍅</span> */}
              <Image
                src="/tomato.png"
                alt="Pomodash"
                width={28}
                height={28}
                className="rounded-sm"
              />
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
                    : "text-base-content/70 hover:text-base-content hover:bg-base-200",
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
              className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
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
                    quality={75}
                    sizes="32px"
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
                  <p className="text-xs text-base-content/70 truncate mt-0.5">
                    {user.email}
                  </p>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-base-content/70" />
                    Settings
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </li>
              </ul>
            </div>

            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
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
                  quality={75}
                  sizes="32px"
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
              <p className="text-xs text-base-content/70 truncate">
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
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-content"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-200",
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="px-3 py-2 border-t border-base-300">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-error hover:bg-error/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
