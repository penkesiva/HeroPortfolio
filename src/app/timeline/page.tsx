import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PortfolioShell } from "@/components/PortfolioShell";
import { SignOutButton } from "@/components/SignOutButton";
import {
  siteIntro,
  timeline,
  type SiteIntro,
} from "@/data/timeline";
import { displayNameFromUser } from "@/lib/auth/displayName";
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
  const studentIntro: SiteIntro = {
    ...siteIntro,
    name,
    heroLead: "I'm",
    role: "Student · Your portfolio timeline",
    bio: "Add your milestones, media, and links below. Use Content editor (draft) to shape your story year by year.",
    photoAlt: name,
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
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-parchment-muted sm:inline">
              Signed in as{" "}
              <span className="font-medium text-parchment">{name}</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <PortfolioShell timeline={mergedTimeline} siteIntro={studentIntro} />
    </div>
  );
}
