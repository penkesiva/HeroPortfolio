import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortfolioShell } from "@/components/PortfolioShell";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import { getUserPlan, getUserTimeline, getChildProfile, childProfileToSiteIntro } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ childId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { childId } = await params;
  if (!isSupabaseConfigured()) return { title: "Portfolio" };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { title: "Portfolio" };
  const child = await getChildProfile(supabase, user.id, childId);
  return {
    title: child ? `${child.display_name}'s Timeline · HeroPortfolio` : "Portfolio",
  };
}

export default async function ChildTimelinePage({ params }: Props) {
  const { childId } = await params;
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/children/${childId}`);

  await mustHaveAccountKindOrRedirect(supabase, user.id, `/children/${childId}`);

  // Verify ownership — getChildProfile enforces parent_user_id = user.id
  const child = await getChildProfile(supabase, user.id, childId);
  if (!child) redirect("/children");

  const CURRENT_YEAR = new Date().getFullYear();

  // Derive oldest timeline year from birth_year (kindergarten ~ birth+5)
  // or grade (count back from current year to when they started school)
  let initialOldestYear: number | null = null;
  if (child.birth_year) {
    initialOldestYear = child.birth_year + 5; // kindergarten start year
  } else if (child.grade != null) {
    // grade 1 started (grade - 1) years before current year
    initialOldestYear = CURRENT_YEAR - Math.max(child.grade - 1, 0);
  }

  const [dbTimeline, plan, siteIntro] = await Promise.all([
    getUserTimeline(supabase, childId),
    getUserPlan(supabase, user.id),
    childProfileToSiteIntro(supabase, child),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Back to children dashboard */}
      <div className="sticky top-0 z-40 border-b border-dusk-800/60 bg-dusk-950/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a
            href="/children"
            className="flex items-center gap-1.5 text-sm text-parchment-muted transition hover:text-parchment"
          >
            ← All children
          </a>
          <span className="text-sm font-semibold text-parchment">
            {child.display_name}
          </span>
          <div className="w-24" />
        </div>
      </div>

      <PortfolioShell
        timeline={dbTimeline}
        siteIntro={siteIntro}
        userId={childId}
        plan={plan}
        initialGrade={child.grade}
        initialOldestYear={initialOldestYear}
      />
    </div>
  );
}
