import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddPortfolioForm } from "@/components/portfolios/AddPortfolioForm";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import { getPortfolioProfiles, getProfile, getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getLimit } from "@/lib/planGate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add portfolio · HeroPortfolio",
};

export default async function AddPortfolioPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/portfolios/new");

  await mustHaveAccountKindOrRedirect(supabase, user.id, "/portfolios/new");

  const profile = await getProfile(supabase, user.id);
  if (!profile?.account_kind) redirect("/onboarding/who?next=/portfolios/new");

  const [plan, portfolios] = await Promise.all([
    getUserPlan(supabase, user.id),
    getPortfolioProfiles(supabase, user.id),
  ]);

  if (portfolios.length >= getLimit(plan, "maxPortfolioProfiles")) {
    redirect("/pricing?reason=portfolio_limit");
  }

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <header className="border-b border-dusk-800/80 bg-dusk-950/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />
          <Link
            href="/portfolios"
            className="text-sm text-parchment-muted transition hover:text-parchment"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <AddPortfolioForm accountKind={profile.account_kind} />
      </main>
    </div>
  );
}
