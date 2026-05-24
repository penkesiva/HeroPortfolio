import { redirect } from "next/navigation";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import { resolveDefaultPortfolioId, getProfile } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LegacyTimelineRedirect({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  await mustHaveAccountKindOrRedirect(supabase, user.id, "/timeline");

  const profile = await getProfile(supabase, user.id);
  const portfolioId = await resolveDefaultPortfolioId(
    supabase,
    user.id,
    profile?.account_kind ?? null,
  );

  const suffix = upgraded === "1" ? "?upgraded=1" : "";

  if (portfolioId) {
    redirect(`/portfolios/${portfolioId}${suffix}`);
  }

  redirect("/portfolios");
}
