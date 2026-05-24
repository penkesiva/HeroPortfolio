import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfile } from "@/lib/db/portfolio";

const LEGACY_CHILD_PREFIX = "/children";
const LEGACY_TIMELINE_PREFIX = "/timeline";
const PORTFOLIOS_PREFIX = "/portfolios";

/**
 * If the user has not chosen self vs guardian yet, send them to onboarding.
 * Both account kinds use the unified /portfolios hub.
 */
export async function mustHaveAccountKindOrRedirect(
  supabase: SupabaseClient,
  userId: string,
  nextPath: string,
): Promise<void> {
  const profile = await getProfile(supabase, userId);
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (profile.account_kind == null) {
    redirect(`/onboarding/who?next=${encodeURIComponent(nextPath)}`);
  }

  if (nextPath.startsWith(LEGACY_CHILD_PREFIX)) {
    redirect(nextPath.replace(LEGACY_CHILD_PREFIX, PORTFOLIOS_PREFIX));
  }

  if (
    nextPath === LEGACY_TIMELINE_PREFIX ||
    nextPath.startsWith(`${LEGACY_TIMELINE_PREFIX}/`)
  ) {
    return;
  }
}
