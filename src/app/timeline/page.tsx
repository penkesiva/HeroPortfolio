import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PortfolioShell } from "@/components/PortfolioShell";
import { UpgradedBanner } from "@/components/UpgradedBanner";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { getUserTimeline, getProfile, dbProfileToSiteIntro } from "@/lib/db/portfolio";
import { getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your timeline",
  description:
    "Build your HeroPortfolio timeline: achievements and milestones year by year.",
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/timeline");
  }

  const name = displayNameFromUser(user);

  // Load profile and timeline from DB
  const [profile, dbTimeline, plan] = await Promise.all([
    getProfile(supabase, user.id),
    getUserTimeline(supabase, user.id),
    getUserPlan(supabase, user.id),
  ]);

  const siteIntro = await dbProfileToSiteIntro(supabase, profile, name);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userId={user.id} displayName={name} plan={plan} />
      {upgraded === "1" && <UpgradedBanner />}
      <PortfolioShell
        timeline={dbTimeline}
        siteIntro={siteIntro}
        userId={user.id}
        plan={plan}
      />
    </div>
  );
}
