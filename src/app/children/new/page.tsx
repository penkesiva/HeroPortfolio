import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddChildForm } from "@/components/children/AddChildForm";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import { getChildProfiles, getProfile, getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getLimit } from "@/lib/planGate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Add Child · HeroPortfolio",
};

export default async function AddChildPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/children/new");

  await mustHaveAccountKindOrRedirect(supabase, user.id, "/children/new");

  const profile = await getProfile(supabase, user.id);
  if (profile?.account_kind === "self") redirect("/timeline");

  // Block free-tier parents who have hit their child limit
  const [plan, children] = await Promise.all([
    getUserPlan(supabase, user.id),
    getChildProfiles(supabase, user.id),
  ]);
  if (children.length >= getLimit(plan, "maxChildProfiles")) {
    redirect("/pricing?reason=child_limit");
  }

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <header className="border-b border-dusk-800/80 bg-dusk-950/90 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />
          <a
            href="/children"
            className="text-sm text-parchment-muted transition hover:text-parchment"
          >
            ← Back
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <AddChildForm />
      </main>
    </div>
  );
}
