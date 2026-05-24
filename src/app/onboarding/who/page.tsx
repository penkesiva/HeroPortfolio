import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWhoClient } from "@/components/onboarding/OnboardingWhoClient";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import { getProfile } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Who is this for? · HeroPortfolio.com",
  description:
    "Tell HeroPortfolio whether you are building your own portfolio or managing a child’s.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function OnboardingWhoPage({ searchParams }: Props) {
  const q = await searchParams;
  const rawNext = sanitizeAuthRedirect(q.next, "/portfolios");
  const nextPath = rawNext.startsWith("/onboarding") ? "/portfolios" : rawNext;

  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/onboarding/who?next=${encodeURIComponent(nextPath)}`)}`);
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (profile.account_kind != null) {
    redirect(nextPath);
  }

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <header className="border-b border-dusk-800/80 bg-dusk-950/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-center sm:justify-start">
          <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <OnboardingWhoClient nextPath={nextPath} />
      </main>
    </div>
  );
}
