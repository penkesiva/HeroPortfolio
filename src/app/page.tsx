import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingPageContent } from "@/components/home/LandingPageContent";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import {
  LANDING_PAGE_META_DESCRIPTION,
  LANDING_PAGE_META_TITLE,
  LANDING_PAGE_OG_DESCRIPTION,
} from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: LANDING_PAGE_META_TITLE,
  description: LANDING_PAGE_META_DESCRIPTION,
  openGraph: {
    title: LANDING_PAGE_META_TITLE,
    description: LANDING_PAGE_OG_DESCRIPTION,
    url: "https://heroportfolio.com",
    siteName: "HeroPortfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: LANDING_PAGE_META_TITLE,
    description: LANDING_PAGE_OG_DESCRIPTION,
  },
};

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/portfolios");
  }

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/pricing"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-umber-300/90 transition hover:text-umber-200 sm:inline-flex sm:px-4"
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
              className="whitespace-nowrap rounded-full border border-umber-500/45 bg-umber-500/15 px-4 py-2 text-sm font-medium text-umber-200 transition hover:bg-umber-500/25"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <LandingPageContent />
      </main>

      <footer className="border-t border-dusk-700/70 bg-dusk-900/30 py-6 text-center text-xs text-parchment-muted/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          <span>© {new Date().getFullYear()} OneCreator LLC. All rights reserved.</span>
          <span className="text-dusk-700">·</span>
          <Link href="/pricing" className="transition hover:text-parchment-muted">
            Plans
          </Link>
          <span className="text-dusk-700">·</span>
          <Link href="/login" className="transition hover:text-parchment-muted">
            Log in
          </Link>
          <span className="text-dusk-700">·</span>
          <Link href="/signup" className="transition hover:text-parchment-muted">
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
