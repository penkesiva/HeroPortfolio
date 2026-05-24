import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PortfolioHubCard } from "@/components/portfolios/PortfolioHubCard";
import { ChildrenEmptyIllustration } from "@/components/children/ChildrenEmptyIllustration";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import { displayNameFromUser } from "@/lib/auth/displayName";
import {
  ensurePrimaryPortfolioProfile,
  getPortfolioHubEntries,
  getProfile,
  getUserPlan,
} from "@/lib/db/portfolio";
import {
  FREE_PORTFOLIO_LIMIT,
  PORTFOLIOS_ADD_LABEL_GUARDIAN,
  PORTFOLIOS_ADD_LABEL_SELF,
  PORTFOLIOS_EMPTY_BODY_GUARDIAN,
  PORTFOLIOS_EMPTY_BODY_SELF,
  PORTFOLIOS_EMPTY_HEADLINE,
  PORTFOLIOS_FREE_USAGE_LABEL,
  PORTFOLIOS_GUARDIAN_EYEBROW,
  PORTFOLIOS_LIMIT_UPGRADE_BODY,
  PORTFOLIOS_PAGE_META_DESCRIPTION,
  PORTFOLIOS_PAGE_TITLE,
  PORTFOLIOS_STUDENT_EYEBROW,
} from "@/lib/constants";
import { getLimit } from "@/lib/planGate";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: `${PORTFOLIOS_PAGE_TITLE} · HeroPortfolio`,
  description: PORTFOLIOS_PAGE_META_DESCRIPTION,
};

export default async function PortfoliosPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/portfolios");

  await mustHaveAccountKindOrRedirect(supabase, user.id, "/portfolios");

  const profile = await getProfile(supabase, user.id);
  if (!profile?.account_kind) redirect("/onboarding/who?next=/portfolios");

  if (profile.account_kind === "self") {
    await ensurePrimaryPortfolioProfile(
      supabase,
      user.id,
      profile.display_name ?? displayNameFromUser(user),
    );
  }

  const [portfolioEntries, plan] = await Promise.all([
    getPortfolioHubEntries(supabase, user.id),
    getUserPlan(supabase, user.id),
  ]);
  const portfolios = portfolioEntries.map((entry) => entry.portfolio);

  const displayName = displayNameFromUser(user);
  const avatarSrc = profile?.photo_url ?? null;
  const isGuardian = profile.account_kind === "guardian";
  const maxPortfolios = getLimit(plan, "maxPortfolioProfiles");
  const atLimit = plan === "free" && portfolios.length >= maxPortfolios;

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <AppHeader
        userId={user.id}
        displayName={displayName}
        plan={plan}
        avatarSrc={avatarSrc}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
              {isGuardian ? PORTFOLIOS_GUARDIAN_EYEBROW : PORTFOLIOS_STUDENT_EYEBROW}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {PORTFOLIOS_PAGE_TITLE}
            </h1>
            {plan === "free" && (
              <p className="mt-1 text-xs text-parchment-muted/60">
                {PORTFOLIOS_FREE_USAGE_LABEL(portfolios.length, FREE_PORTFOLIO_LIMIT)}
              </p>
            )}
          </div>

          <Link
            href="/portfolios/new"
            className="flex items-center gap-2 rounded-full border border-umber-500/50 bg-umber-500/15 px-4 py-2 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/25"
          >
            <span className="text-base leading-none">+</span>
            {isGuardian ? PORTFOLIOS_ADD_LABEL_GUARDIAN : PORTFOLIOS_ADD_LABEL_SELF}
          </Link>
        </div>

        {atLimit && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-umber-500/30 bg-umber-500/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-umber-200">
                Free limit reached — {FREE_PORTFOLIO_LIMIT} portfolios
              </p>
              <p className="mt-0.5 text-xs text-parchment-muted">
                {PORTFOLIOS_LIMIT_UPGRADE_BODY}
              </p>
            </div>
            <Link
              href="/pricing?reason=portfolio_limit"
              className="shrink-0 rounded-full border border-umber-500/50 bg-umber-500/20 px-4 py-2 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/30"
            >
              See plans
            </Link>
          </div>
        )}

        {portfolios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-dusk-600/60 bg-dusk-900/30 px-6 py-16 text-center">
            <ChildrenEmptyIllustration />
            <h2 className="mt-4 text-lg font-semibold text-parchment">
              {PORTFOLIOS_EMPTY_HEADLINE}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-parchment-muted">
              {isGuardian ? PORTFOLIOS_EMPTY_BODY_GUARDIAN : PORTFOLIOS_EMPTY_BODY_SELF}
            </p>
            <Link
              href="/portfolios/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-umber-500/50 bg-umber-500/15 px-5 py-2.5 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/25"
            >
              + {isGuardian ? PORTFOLIOS_ADD_LABEL_GUARDIAN : PORTFOLIOS_ADD_LABEL_SELF}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {portfolioEntries.map((entry) => (
              <PortfolioHubCard
                key={entry.portfolio.id}
                portfolio={entry.portfolio}
                photoSrc={entry.photoSrc}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
