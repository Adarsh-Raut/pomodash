// components/landing/LandingPage.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "⏱",
    title: "Precision Timer",
    desc: "25-minute focus blocks engineered for deep work. Fully customizable to your rhythm.",
  },
  {
    icon: "📊",
    title: "Session Analytics",
    desc: "Track daily, weekly, and monthly focus time. Visualize your productivity patterns.",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "See how you rank against other focused minds. Healthy competition drives consistency.",
  },
  {
    icon: "🌙",
    title: "Dark & Light",
    desc: "Easy on your eyes at 2am or 2pm. Persists your preference across every session.",
  },
];

const stats = [
  { value: "25", unit: "min", label: "Default focus block" },
  { value: "5", unit: "min", label: "Short break" },
  { value: "4", unit: "×", label: "Sessions before long break" },
];

// Animated ticking clock display
function LiveClock() {
  const [time, setTime] = useState("25:00");
  const [ticking, setTicking] = useState(false);
  const [seconds, setSeconds] = useState(1500);

  useEffect(() => {
    if (!ticking) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 0) {
          setTicking(false);
          return 1500;
        }
        const next = s - 1;
        const m = Math.floor(next / 60);
        const sec = next % 60;
        setTime(
          `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
        );
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ticking]);

  const progress = ((1500 - seconds) / 1500) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full blur-3xl opacity-20"
        style={{
          width: 340,
          height: 340,
          background: "oklch(0.546 0.245 262.881)",
        }}
      />

      {/* SVG clock ring */}
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx="150"
          cy="150"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-white/20"
        />
        {/* Progress */}
        <motion.circle
          cx="150"
          cy="150"
          r={radius}
          fill="none"
          stroke="oklch(0.546 0.245 262.881)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "linear" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <motion.div
          key={time}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="font-mono text-6xl font-bold tracking-tight text-white"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {time}
        </motion.div>
        <button
          onClick={() => {
            setTicking((t) => !t);
            if (!ticking) {
              setSeconds(1500);
              setTime("25:00");
            }
          }}
          className="text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
        >
          {ticking ? "PAUSE" : "TRY IT"}
        </button>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  index,
}: {
  icon: string;
  title: string;
  desc: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="group p-6 rounded-2xl border border-white/20 bg-white/8 hover:bg-white/12 hover:border-white/35 transition-all duration-300"
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export function LandingPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: "oklch(0.18 0.05 260)" }}
    >
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍅</span>
          <span className="font-bold text-lg tracking-tight">Pomodash</span>
        </div>
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-white/40 text-white hover:border-white/70 hover:bg-white/10 transition-all"
        >
          {loading ? "..." : "Sign in"}
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-medium tracking-wider uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Focus · Rest · Repeat
              </div>

              <h1 className="text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
                Deep work,
                <br />
                <span style={{ color: "oklch(0.546 0.245 262.881)" }}>
                  measured.
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-white/50 text-lg leading-relaxed max-w-md"
            >
              A Pomodoro timer that tracks every session, visualizes your focus
              patterns, and shows where you stand among the most productive
              people you know.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="group flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                style={{ background: "oklch(0.546 0.245 262.881)" }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  // Google icon
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      fillOpacity=".9"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#fff"
                      fillOpacity=".9"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fff"
                      fillOpacity=".9"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#fff"
                      fillOpacity=".9"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </button>

              <span className="text-white/30 text-sm">
                Free · No credit card
              </span>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-8 pt-4 border-t border-white/10"
            >
              {stats.map(({ value, unit, label }) => (
                <div key={label}>
                  <div className="text-2xl font-black text-white">
                    {value}
                    <span className="text-white/40 text-lg">{unit}</span>
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — live clock demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center"
          >
            <LiveClock />
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">
            Everything you need to stay in flow
          </h2>
          <p className="text-white/40 text-sm">
            Built for people who take their time seriously.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: "oklch(0.24 0.06 260)" }}
        >
          {/* Decorative glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: "oklch(0.546 0.245 262.881)" }}
          />
          <h2 className="text-4xl font-black text-white mb-4 relative">
            Start your first session.
          </h2>
          <p className="text-white/40 mb-8 relative">
            Takes 10 seconds to sign in. Takes 25 minutes to get things done.
          </p>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] active:scale-[0.98] relative"
            style={{ background: "oklch(0.546 0.245 262.881)" }}
          >
            {loading ? "Signing in..." : "Get started free →"}
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-white/20 text-sm">
          <div className="flex items-center gap-2">
            <span>🍅</span>
            <span>Pomodash</span>
          </div>
          <span>Focus deeply. Rest intentionally.</span>
        </div>
      </footer>
    </div>
  );
}
