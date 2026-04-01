"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { signIn } from "next-auth/react";

interface SignInButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  children: ReactNode;
}

export function SignInButton({
  className,
  children,
  ...props
}: SignInButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      {...props}
    >
      {loading ? "Signing in..." : children}
    </button>
  );
}
