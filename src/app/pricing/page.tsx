import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PricingPlansClient } from "@/components/PricingPlansClient";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { getProfile } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Plans & pricing",
  description:
    "HeroPortfolio Basic is free forever. Pro adds unlimited events, AI Smart Import, PDF export, and analytics for $4.99/mo or $39.99/yr.",
};

export default async function PricingPage() {
  let userPlan: "free" | "pro" = "free";
  let hasStripeCustomer = false;
  let isLoggedIn = false;
  let userId = "";
  let displayName = "";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        isLoggedIn = true;
        userId = user.id;
        displayName = displayNameFromUser(user);
        const profile = await getProfile(supabase, user.id);
        userPlan = (profile?.plan as "free" | "pro") ?? "free";
        hasStripeCustomer = Boolean(profile?.stripe_customer_id);
      }
    } catch {
      // Non-fatal — show pricing page unauthenticated
    }
  }

  return (
    <div className="flex min-h-screen flex-col text-parchment">
      {isLoggedIn ? (
        <AppHeader userId={userId} displayName={displayName} plan={userPlan} />
      ) : (
        <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2 transition"
              aria-label="HeroPortfolio.com home"
            >
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
            <nav className="flex items-center gap-2 sm:gap-3">
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
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        {isLoggedIn && (
          <div className="mb-6">
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1.5 text-sm text-parchment-muted transition hover:text-parchment"
            >
              ← Timeline
            </Link>
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
          Pricing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Plans that match how you achieve
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-parchment-muted sm:text-[17px]">
          Start free with a full portfolio. Upgrade to Pro for AI-powered import, unlimited photos, and PDF export. Or go Family for up to 4 members at one simple price.
        </p>

        <div className="mt-12">
          <PricingPlansClient
            userPlan={userPlan}
            hasStripeCustomer={hasStripeCustomer}
          />
        </div>
      </main>
    </div>
  );
}
