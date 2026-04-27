import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BackToTimeline } from "@/components/BackToTimeline";
import { PricingPlansClient } from "@/components/PricingPlansClient";
import { SiteBrandLink } from "@/components/SiteBrandLink";
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
            <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />
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
            <BackToTimeline />
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
            isLoggedIn={isLoggedIn}
          />
        </div>
      </main>
    </div>
  );
}
