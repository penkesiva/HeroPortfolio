import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BadgesClient } from "@/components/BadgesClient";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { getUserTimeline, getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeBadges } from "@/lib/badges";

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
  const [timeline, plan] = await Promise.all([
    getUserTimeline(supabase, user.id),
    getUserPlan(supabase, user.id),
  ]);

  const badges = computeBadges(timeline);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userId={user.id} displayName={name} plan={plan} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-2">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1.5 text-sm text-parchment-muted transition hover:text-parchment"
          >
            ← Timeline
          </Link>
        </div>

        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            My Badges
          </h1>
          <p className="mt-2 text-sm text-parchment-muted">
            Earn badges by logging achievements across categories. New badges unlock as your portfolio grows.
          </p>
        </div>

        <BadgesClient badges={badges} />
      </main>
    </div>
  );
}
