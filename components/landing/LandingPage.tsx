import Image from "next/image";
import { SignInButton } from "./SignInButton";

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

export function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden text-white"
      style={{ background: "oklch(0.18 0.05 260)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Image
            src="/tomato.png"
            alt="Pomodash"
            width={28}
            height={28}
            quality={50}
            priority
            className="rounded-sm"
          />
          <span className="text-lg font-bold tracking-tight">Pomodash</span>
        </div>
        <SignInButton className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-white/70 hover:bg-white/10 disabled:opacity-70">
          Sign in
        </SignInButton>
      </nav>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Focus · Rest · Repeat
              </div>

              <h1 className="text-6xl font-black leading-[0.95] tracking-tight lg:text-7xl">
                Deep work,
                <br />
                <span style={{ color: "oklch(0.546 0.245 262.881)" }}>
                  measured.
                </span>
              </h1>
            </div>

            <p className="max-w-md text-lg leading-relaxed text-white/50">
              A Pomodoro timer that tracks every session, visualizes your focus
              patterns, and shows where you stand among the most productive
              people you know.
            </p>

            <div className="flex items-center gap-4">
              <SignInButton
                className="group flex items-center gap-3 rounded-xl px-6 py-3.5 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                style={{ background: "oklch(0.546 0.245 262.881)" }}
              >
                <span
                  className="inline-flex items-center gap-3"
                  style={{ color: "inherit" }}
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
                  Continue with Google
                </span>
              </SignInButton>

              <span className="text-sm text-white/30">
                Free · No credit card
              </span>
            </div>

            <div className="flex items-center gap-8 border-t border-white/10 pt-4">
              {stats.map(({ value, unit, label }) => (
                <div key={label}>
                  <div className="text-2xl font-black text-white">
                    {value}
                    <span className="text-lg text-white/40">{unit}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-white/40">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative flex select-none items-center justify-center">
              <div
                className="absolute rounded-full opacity-20 blur-3xl"
                style={{
                  width: 340,
                  height: 340,
                  background: "oklch(0.546 0.245 262.881)",
                }}
              />
              <svg
                width="300"
                height="300"
                viewBox="0 0 300 300"
                className="-rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="150"
                  cy="150"
                  r="120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-white/20"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="120"
                  fill="none"
                  stroke="oklch(0.546 0.245 262.881)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="754"
                  strokeDashoffset="188"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div
                  className="font-mono text-6xl font-bold tracking-tight text-white"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  25:00
                </div>
                <div className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/60">
                  Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-black text-white">
            Everything you need to stay in flow
          </h2>
          <p className="text-sm text-white/40">
            Built for people who take their time seriously.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/20 bg-white/8 p-6 transition-colors hover:border-white/35 hover:bg-white/12"
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/50">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: "oklch(0.24 0.06 260)" }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "oklch(0.546 0.245 262.881)" }}
          />
          <h2 className="relative mb-4 text-4xl font-black text-white">
            Start your first session.
          </h2>
          <p className="relative mb-8 text-white/40">
            Takes 10 seconds to sign in. Takes 25 minutes to get things done.
          </p>
          <SignInButton
            className="relative rounded-xl px-8 py-4 text-lg font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "oklch(0.546 0.245 262.881)" }}
          >
            <span style={{ color: "inherit" }}>Get started free →</span>
          </SignInButton>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-white/20">
          <div className="flex items-center gap-2">
            <Image
              src="/tomato.png"
              alt="Pomodash"
              width={28}
              height={28}
              quality={50}
              className="rounded-sm"
            />
            <span>Pomodash</span>
          </div>
          <span>Focus deeply. Rest intentionally.</span>
        </div>
      </footer>
    </div>
  );
}
