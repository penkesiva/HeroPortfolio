import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfile } from "@/lib/db/portfolio";

/**
 * If the user has not chosen self vs guardian yet, send them to onboarding.
 * If they have chosen, enforce they are on the right route type:
 *   - guardian → /children (not /timeline)
 *   - self     → /timeline (not /children)
 * Call after confirming `user` is non-null.
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
  // Redirect guardians away from self-only routes
  if (profile.account_kind === "guardian" && nextPath.startsWith("/timeline")) {
    redirect("/children");
  }
  // Redirect self-accounts away from guardian-only routes
  if (profile.account_kind === "self" && nextPath.startsWith("/children")) {
    redirect("/timeline");
  }
}
