import crypto from "node:crypto";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPortfolioClient } from "@/components/PublicPortfolioClient";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import { isPublicProfileUserId } from "@/lib/auth/profileId";
import {
  getProfile,
  getUserTimeline,
  dbProfileToSiteIntro,
  recordProfileView,
} from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  if (!isPublicProfileUserId(userId) || !isSupabaseConfigured()) {
    return { title: "Portfolio" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const profile = await getProfile(supabase, userId);
    const name = profile?.display_name ?? "Student";
    return {
      title: `${name}'s portfolio`,
      description: `${name}'s achievement timeline on HeroPortfolio.com`,
    };
  } catch {
    return { title: "Student portfolio" };
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  if (!isPublicProfileUserId(userId)) {
    notFound();
  }

  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  const [profile, dbTimeline] = await Promise.all([
    getProfile(supabase, userId),
    getUserTimeline(supabase, userId),
  ]);

  // Record anonymized view in background (best-effort)
  try {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
    const referrer = headersList.get("referer") ?? undefined;
    void recordProfileView(supabase, userId, ipHash, referrer);
  } catch {
    // Non-fatal
  }

  const genericIntro = await dbProfileToSiteIntro(supabase, profile, "Student portfolio");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-parchment-muted sm:gap-3">
            <Link
              href="/pricing"
              className="rounded-full px-2 py-1.5 font-medium text-umber-300/95 hover:text-umber-200 sm:px-3"
            >
              Plans &amp; Pro
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-umber-500/35 bg-umber-500/10 px-3 py-1.5 font-medium text-umber-200 transition hover:bg-umber-500/20"
            >
              Sign up free
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
        serverTimeline={dbTimeline}
        genericIntro={genericIntro}
        isPro={profile?.plan === "pro"}
      />
    </div>
  );
}
