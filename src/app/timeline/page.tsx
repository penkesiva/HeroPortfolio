import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PortfolioShell } from "@/components/PortfolioShell";
import { TimelineAccountMenu } from "@/components/TimelineAccountMenu";
import {
  siteIntro,
  timeline,
  type SiteIntro,
} from "@/data/timeline";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { loadProfileIntroOverrides } from "@/lib/loadProfileIntro";
import { mergeTimelineWithPublicContent } from "@/lib/loadYearEvents";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your timeline",
  description:
    "Build your HeroPortfolio timeline — achievements and milestones year by year.",
};

export default async function TimelinePage() {
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
  const profile = loadProfileIntroOverrides();
  const studentIntro: SiteIntro = {
    ...siteIntro,
    ...profile,
    name,
    photoAlt: name,
    role:
      profile.role ??
      "Student · Your portfolio timeline",
    bio:
      profile.bio ??
      "Add your milestones, media, and links below. Use the floating Edit content button to shape your story year by year, or edit the JSON under public/content/<year>/events.json.",
    heroLead:
      profile.heroLead !== undefined ? profile.heroLead : siteIntro.heroLead,
  };

  const mergedTimeline = mergeTimelineWithPublicContent(timeline);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-parchment transition hover:text-umber-200"
          >
            HeroPortfolio.com
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-full border border-umber-500/35 bg-umber-500/10 px-3 py-1.5 text-sm transition hover:border-umber-400/50 hover:bg-umber-500/18"
            >
              <span className="font-medium text-umber-200">Plans</span>
              <span className="rounded-full bg-umber-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-umber-200">
                Pro
              </span>
            </Link>
            <TimelineAccountMenu userId={user.id} displayName={name} />
          </div>
        </div>
      </header>
      <PortfolioShell timeline={mergedTimeline} siteIntro={studentIntro} />
    </div>
  );
}
