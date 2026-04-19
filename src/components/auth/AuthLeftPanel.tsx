"use client";

import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const SPARKLES = [
  { left: "14%", top: "22%", delay: "0s",    size: 6 },
  { left: "78%", top: "14%", delay: "0.7s",  size: 4 },
  { left: "88%", top: "58%", delay: "1.4s",  size: 5 },
  { left: "22%", top: "72%", delay: "0.4s",  size: 4 },
  { left: "60%", top: "10%", delay: "1.9s",  size: 3 },
  { left: "8%",  top: "50%", delay: "1.1s",  size: 4 },
];

export function AuthLeftPanel({ mode }: { mode: "login" | "signup" }) {
  return (
    <aside className="relative hidden w-[52%] shrink-0 flex-col overflow-hidden bg-dusk-900 lg:flex">
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-umber-500/10 blur-3xl"
        style={{ animation: "auth-glow-pulse 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-0 size-80 rounded-full bg-umber-500/8 blur-3xl"
        style={{ animation: "auth-glow-pulse 8s ease-in-out infinite 2s" }}
      />

      <div className="relative flex flex-1 flex-col p-12 xl:p-16">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3 self-start">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-umber-500/20 ring-1 ring-umber-500/35 text-umber-300 transition group-hover:bg-umber-500/30">
            <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
              <path d="M12 2.5 14.4 8.7l6.9.6-5.1 4.5 1.5 6.6L12 16.8l-5.7 3.6 1.5-6.6-5.1-4.5 6.9-.6z" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="text-xl font-bold tracking-tight text-parchment transition group-hover:text-umber-200">
              Hero
            </span>
            <span className="text-xl font-semibold tracking-tight text-parchment/70 transition group-hover:text-umber-200/70">
              Portfolio
            </span>
            <span className="text-xs font-normal text-parchment-muted/50">.com</span>
          </span>
        </Link>

        {/* Headline */}
        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
            {mode === "login" ? "Welcome back, hero" : "Start your journey"}
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-parchment xl:text-[2.75rem]">
            Every achievement<br />
            deserves to be<br />
            <span className="text-umber-300">remembered.</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-parchment-muted">
            Build your hero&apos;s journey, year by year. Share it with coaches,
            colleges, and the world.
          </p>
        </div>

        {/* Animation card — fills remaining space */}
        <div className="relative mt-10 flex-1">
          <div className="relative h-full min-h-72 overflow-hidden rounded-2xl border border-dusk-600/40 bg-dusk-950/70">
            {/* Dot-grid background */}
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #9a7650 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Sparkle dots */}
            {SPARKLES.map((s, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-umber-300"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  animation: `auth-sparkle 3s ease-in-out infinite ${s.delay}`,
                }}
              />
            ))}

            {/* Rocket Lottie animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <DotLottieReact
                src="/animations/hero_rocket.lottie"
                loop
                autoplay
                className="h-72 w-72 xl:h-80 xl:w-80"
              />
            </div>

            {/* Floating achievement card 1 */}
            <div
              className="absolute left-4 top-5 rounded-xl border border-dusk-600/70 bg-dusk-900/95 p-3 shadow-2xl backdrop-blur-sm"
              style={{ animation: "auth-float 4.2s ease-in-out infinite" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-xs font-semibold text-parchment">
                    Science Fair Winner
                  </p>
                  <p className="mt-0.5 text-[10px] text-parchment-muted">
                    Regional · 2024
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-umber-500/20 px-2 py-0.5 text-[10px] font-medium text-umber-300">
                  Academic
                </span>
              </div>
            </div>

            {/* Floating achievement card 2 */}
            <div
              className="absolute bottom-6 right-4 rounded-xl border border-dusk-600/70 bg-dusk-900/95 p-3 shadow-2xl backdrop-blur-sm"
              style={{
                animation: "auth-float-slow 5.5s ease-in-out infinite 0.9s",
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚽</span>
                <div>
                  <p className="text-xs font-semibold text-parchment">
                    Team Captain
                  </p>
                  <p className="mt-0.5 text-[10px] text-parchment-muted">
                    Soccer · 2023
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                  Sports
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </aside>
  );
}
