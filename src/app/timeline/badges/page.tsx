import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BackToTimeline } from "@/components/BackToTimeline";
import { BadgesClient } from "@/components/BadgesClient";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { dbProfileToSiteIntro, getProfile, getUserPlan, getUserTimeline } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeBadges, computeLifetimeRaised } from "@/lib/badges";

export const metadata: Metadata = {
  title: "My Badges",
  description: "Achievements and milestones you have unlocked on your HeroPortfolio.",
};

export default async function BadgesPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline/badges");

  const name = displayNameFromUser(user);
  const [profile, timeline, plan] = await Promise.all([
    getProfile(supabase, user.id),
    getUserTimeline(supabase, user.id),
    getUserPlan(supabase, user.id),
  ]);
  const siteIntro = await dbProfileToSiteIntro(supabase, profile, name);

  const badges = computeBadges(timeline);
  const lifetimeRaised = computeLifetimeRaised(timeline);

  return (
    <div className="badges-page-bg flex min-h-screen flex-col">
      <AppHeader
        userId={user.id}
        displayName={name}
        plan={plan}
        avatarSrc={siteIntro.photoSrc}
        avatarAlt={siteIntro.photoAlt ?? siteIntro.name}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-2">
          <BackToTimeline />
        </div>

        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            My Badges
          </h1>
          <p className="mt-2 text-sm text-parchment-muted">
            Earn badges by logging achievements across categories. New badges unlock as your portfolio grows.
          </p>
        </div>

        <BadgesClient badges={badges} lifetimeRaised={lifetimeRaised} />
      </main>
    </div>
  );
}
