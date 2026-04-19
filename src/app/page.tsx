import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HomeLottie } from "@/components/home/HomeLottie";

export const metadata: Metadata = {
  title: "HeroPortfolio — Track your achievements, year by year",
  description:
    "HeroPortfolio helps students capture competitions, projects, leadership, and growth in a beautiful year-by-year timeline. Free to start.",
  openGraph: {
    title: "HeroPortfolio — Track your achievements, year by year",
    description:
      "A simple place for students to log achievements, milestones, and stories — organized by school year and shareable with anyone.",
    url: "https://heroportfolio.com",
    siteName: "HeroPortfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HeroPortfolio — Track your achievements, year by year",
    description:
      "A simple place for students to log achievements, milestones, and stories — organized by school year.",
  },
};

const features = [
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
        <path d="M8 1.5 9.6 5.8l4.6.4-3.4 3 1 4.4L8 11.2l-3.8 2.4 1-4.4-3.4-3 4.6-.4z" />
      </svg>
    ),
    label: "Log every win",
    desc: "Competitions, projects, volunteer work, sports — all in one place.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
        <path fillRule="evenodd" d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm6 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
      </svg>
    ),
    label: "Photos and links",
    desc: "Attach images, article links, and source URLs to each achievement.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
        <path d="M12.5 4a.5.5 0 0 0-1 0v6.793L10.354 9.646a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L12.5 10.793V4ZM4 3.5a.5.5 0 0 1 .5.5v6.793l1.146-1.147a.5.5 0 1 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L3.5 10.793V4a.5.5 0 0 1 .5-.5Z" />
        <path d="M1 1h14v1H1z" />
      </svg>
    ),
    label: "Year by year",
    desc: "A timeline organized by school year, from middle school through graduation.",
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
        <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z" />
      </svg>
    ),
    label: "Share with anyone",
    desc: "Get a public profile link to share with colleges, coaches, or employers.",
  },
];

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/timeline");
  }

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          {/* Logo — matches AppHeader */}
          <Link href="/" className="group flex items-center gap-2 transition" aria-label="HeroPortfolio home">
            <span className="flex size-9 items-center justify-center rounded-xl bg-umber-500/20 ring-1 ring-umber-500/30 transition group-hover:bg-umber-500/30">
              <svg viewBox="0 0 16 16" className="size-5 fill-umber-300" aria-hidden>
                <path d="M8 1.5 9.6 5.8l4.6.4-3.4 3 1 4.4L8 11.2l-3.8 2.4 1-4.4-3.4-3 4.6-.4z" />
              </svg>
            </span>
            <span className="text-base leading-none">
              <span className="text-lg font-bold tracking-tight text-parchment transition group-hover:text-umber-200">Hero</span>
              <span className="text-lg font-semibold tracking-tight text-parchment/75 transition group-hover:text-umber-200/75">Portfolio</span>
              <span className="text-xs font-normal text-parchment-muted/50 transition group-hover:text-umber-300/60">.com</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/pricing"
              className="rounded-full px-3 py-2 text-sm font-medium text-umber-300/90 transition hover:text-umber-200 sm:px-4"
            >
              Plans
            </Link>
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-parchment-muted transition hover:text-parchment sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-umber-500/45 bg-umber-500/15 px-4 py-2 text-sm font-medium text-umber-200 transition hover:bg-umber-500/25"
            >
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
        {/* Left — copy */}
        <div className="order-2 flex flex-col lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-umber-400">
            For students
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-parchment sm:text-5xl sm:leading-tight lg:text-[2.9rem] lg:leading-tight">
            Your achievements,{" "}
            <span className="text-parchment-muted">year by year.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-parchment-muted sm:text-[17px]">
            HeroPortfolio is a free timeline for students. Capture competitions,
            projects, leadership, and growth — organized by school year, shareable
            with anyone.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-umber-500/50 bg-umber-500/20 px-6 py-3 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-dusk-600 bg-dusk-850/80 px-6 py-3 text-sm font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment"
            >
              Log in
            </Link>
          </div>

          {/* Feature pills */}
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 rounded-xl border border-dusk-700/60 bg-dusk-900/40 px-4 py-3"
              >
                <span className="mt-0.5 shrink-0 text-umber-400">{f.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-parchment">{f.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-parchment-muted/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Lottie trophy */}
        <div className="order-1 flex items-center justify-center lg:order-2 lg:justify-end">
          <div className="relative flex h-[300px] w-[300px] items-center justify-center sm:h-[360px] sm:w-[360px] lg:h-[420px] lg:w-[420px]">
            <HomeLottie />
          </div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-dusk-700/70 bg-dusk-900/30 py-6 text-center text-xs text-parchment-muted/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          <span>© {new Date().getFullYear()} OneCreator LLC. All rights reserved.</span>
          <span className="text-dusk-700">·</span>
          <Link href="/pricing" className="transition hover:text-parchment-muted">Plans</Link>
          <span className="text-dusk-700">·</span>
          <Link href="/login" className="transition hover:text-parchment-muted">Log in</Link>
          <span className="text-dusk-700">·</span>
          <Link href="/signup" className="transition hover:text-parchment-muted">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
