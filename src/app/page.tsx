import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home",
  description:
    "HeroPortfolio.com — students build a public timeline of achievements. Sign up or log in to start.",
};

export default async function HomePage() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }

  return (
    <div className="flex min-h-screen flex-col text-parchment">
      <header className="border-b border-dusk-700/70 bg-dusk-950/40 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-parchment">
            HeroPortfolio.com
          </span>
          <nav className="flex items-center gap-2 sm:gap-3">
            {signedIn ? (
              <Link
                href="/timeline"
                className="rounded-full border border-umber-500/45 bg-umber-500/15 px-4 py-2 text-sm font-medium text-umber-200 transition hover:bg-umber-500/25"
              >
                Your timeline
              </Link>
            ) : (
              <>
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
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-umber-400">
          For students
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-tight">
          Your achievements,
          <span className="block text-parchment-muted">year by year.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-parchment-muted sm:text-[17px]">
          HeroPortfolio is a simple place to capture competitions, projects,
          leadership, and growth. Create a free account, then fill in your
          timeline — photos, links, and stories organized by school year.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {signedIn ? (
            <Link
              href="/timeline"
              className="inline-flex items-center justify-center rounded-full border border-umber-500/50 bg-umber-500/20 px-6 py-3 text-sm font-medium text-umber-100 transition hover:bg-umber-500/30"
            >
              Open your timeline
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-umber-500/50 bg-umber-500/20 px-6 py-3 text-sm font-medium text-umber-100 transition hover:bg-umber-500/30"
              >
                Sign up free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-dusk-600 bg-dusk-850/80 px-6 py-3 text-sm font-medium text-parchment transition hover:border-dusk-500"
              >
                Log in
              </Link>
            </>
          )}
        </div>

        <p className="mt-12 text-xs text-parchment-muted/80">
          Public landing page · After you sign in, you&apos;ll build your
          portfolio on your private timeline.
        </p>
      </main>
    </div>
  );
}
