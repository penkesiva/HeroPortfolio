import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPortfolioClient } from "@/components/PublicPortfolioClient";
import {
  siteIntro,
  timeline,
  type SiteIntro,
} from "@/data/timeline";
import { isPublicProfileUserId } from "@/lib/auth/profileId";
import { loadProfileIntroOverrides } from "@/lib/loadProfileIntro";
import { mergeTimelineWithPublicContent } from "@/lib/loadYearEvents";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  if (!isPublicProfileUserId(userId)) {
    return { title: "Portfolio" };
  }
  return {
    title: "Student portfolio",
    description:
      "Public HeroPortfolio timeline — achievements and milestones shared by link.",
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  if (!isPublicProfileUserId(userId)) {
    notFound();
  }

  const mergedTimeline = mergeTimelineWithPublicContent(timeline);
  const profile = loadProfileIntroOverrides();
  const genericIntro: SiteIntro = {
    ...siteIntro,
    ...profile,
    name: "Student portfolio",
    heroLead: undefined,
    role: "Shared on HeroPortfolio.com",
    bio: "This page opens for anyone with the link. The timeline shows the site’s published content; students build their story in the private editor after signing in.",
    photoAlt: "Student portfolio",
  };

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
          <div className="flex items-center gap-2 text-xs text-parchment-muted">
            <Link
              href="/signup"
              className="rounded-full border border-umber-500/35 bg-umber-500/10 px-3 py-1.5 font-medium text-umber-200 transition hover:bg-umber-500/20"
            >
              Sign up
            </Link>
            <Link
              href="/login?next=%2Ftimeline"
              className="rounded-full px-2 py-1.5 font-medium text-parchment-muted hover:text-parchment"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>
      <PublicPortfolioClient
        profileUserId={userId}
        serverTimeline={mergedTimeline}
        genericIntro={genericIntro}
      />
    </div>
  );
}
