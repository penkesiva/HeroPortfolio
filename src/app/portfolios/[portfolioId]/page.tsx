import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortfolioShell } from "@/components/PortfolioShell";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import {
  childProfileToSiteIntro,
  getPortfolioProfile,
  getUserPlan,
  getUserTimeline,
} from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ portfolioId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { portfolioId } = await params;
  if (!isSupabaseConfigured()) return { title: "Portfolio" };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { title: "Portfolio" };
  const portfolio = await getPortfolioProfile(supabase, user.id, portfolioId);
  return {
    title: portfolio
      ? `${portfolio.display_name}'s Timeline · HeroPortfolio`
      : "Portfolio",
  };
}

export default async function PortfolioTimelinePage({ params }: Props) {
  const { portfolioId } = await params;
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/portfolios/${portfolioId}`);

  await mustHaveAccountKindOrRedirect(
    supabase,
    user.id,
    `/portfolios/${portfolioId}`,
  );

  const portfolio = await getPortfolioProfile(supabase, user.id, portfolioId);
  if (!portfolio) redirect("/portfolios");

  const CURRENT_YEAR = new Date().getFullYear();

  let initialOldestYear: number | null = null;
  if (portfolio.portfolio_kind === "child") {
    if (portfolio.birth_year) {
      initialOldestYear = portfolio.birth_year + 5;
    } else if (portfolio.grade != null) {
      initialOldestYear = CURRENT_YEAR - Math.max(portfolio.grade - 1, 0);
    }
  }

  const [dbTimeline, plan, siteIntro] = await Promise.all([
    getUserTimeline(supabase, portfolioId),
    getUserPlan(supabase, user.id),
    childProfileToSiteIntro(supabase, portfolio),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-40 border-b border-dusk-800/60 bg-dusk-950/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a
            href="/portfolios"
            className="flex items-center gap-1.5 text-sm text-parchment-muted transition hover:text-parchment"
          >
            ← My Portfolios
          </a>
          <span className="text-sm font-semibold text-parchment">
            {portfolio.display_name}
          </span>
          <div className="w-24" />
        </div>
      </div>

      <PortfolioShell
        timeline={dbTimeline}
        siteIntro={siteIntro}
        userId={portfolioId}
        plan={plan}
        initialGrade={portfolio.portfolio_kind === "child" ? portfolio.grade : null}
        initialOldestYear={initialOldestYear}
        portfolioIsPublic={portfolio.is_public ?? false}
      />
    </div>
  );
}
