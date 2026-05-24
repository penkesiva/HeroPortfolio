import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import { mustHaveAccountKindOrRedirect } from "@/lib/auth/accountSetup";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { getChildProfiles, getProfile, getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CHILD_LIMIT_UPGRADE_BODY, FREE_CHILD_LIMIT } from "@/lib/constants";
import { getLimit } from "@/lib/planGate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Children · HeroPortfolio",
  description: "Manage your children's portfolios.",
};

export default async function ChildrenPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/children");

  await mustHaveAccountKindOrRedirect(supabase, user.id, "/children");

  const profile = await getProfile(supabase, user.id);

  // Self-accounts don't belong here
  if (profile?.account_kind === "self") redirect("/timeline");

  const [children, plan] = await Promise.all([
    getChildProfiles(supabase, user.id),
    getUserPlan(supabase, user.id),
  ]);

  const displayName = displayNameFromUser(user);
  const avatarSrc = profile?.photo_url ?? null;

  const maxChildren = getLimit(plan, "maxChildProfiles");
  const atLimit = plan === "free" && children.length >= maxChildren;

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <AppHeader
        userId={user.id}
        displayName={displayName}
        plan={plan}
        avatarSrc={avatarSrc}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {/* Header row */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
              Guardian
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              My Children
            </h1>
            {plan === "free" && (
              <p className="mt-1 text-xs text-parchment-muted/60">
                {children.length} / {FREE_CHILD_LIMIT} free portfolios used
              </p>
            )}
          </div>

          {atLimit ? (
            <Link
              href="/pricing?reason=child_limit"
              className="flex items-center gap-2 rounded-full border border-umber-500/50 bg-umber-500/15 px-4 py-2 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/25"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0">
                <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
              </svg>
              Upgrade to add more
            </Link>
          ) : (
            <Link
              href="/children/new"
              className="flex items-center gap-2 rounded-full border border-umber-500/50 bg-umber-500/15 px-4 py-2 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/25"
            >
              <span className="text-base leading-none">+</span>
              Add child
            </Link>
          )}
        </div>

        {/* Upgrade banner when at free limit */}
        {atLimit && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-umber-500/30 bg-umber-500/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-umber-200">
                Free limit reached — {FREE_CHILD_LIMIT} child portfolios
              </p>
              <p className="mt-0.5 text-xs text-parchment-muted">
                {CHILD_LIMIT_UPGRADE_BODY}
              </p>
            </div>
            <Link
              href="/pricing?reason=child_limit"
              className="shrink-0 rounded-full border border-umber-500/50 bg-umber-500/20 px-4 py-2 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/30"
            >
              See plans
            </Link>
          </div>
        )}

        {children.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-dusk-600/60 bg-dusk-900/30 py-16 text-center">
            <div className="text-5xl">👨‍👩‍👧‍👦</div>
            <h2 className="mt-4 text-lg font-semibold text-parchment">
              No children added yet
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-parchment-muted">
              Add your first child to start building their portfolio together.
            </p>
            <Link
              href="/children/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-umber-500/50 bg-umber-500/15 px-5 py-2.5 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/25"
            >
              + Add first child
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/children/${child.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-dusk-700/90 bg-dusk-900/60 p-6 shadow transition hover:border-umber-500/40 hover:bg-dusk-900/80"
              >
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  {child.photo_url ? (
                    <img
                      src={child.photo_url}
                      alt={child.display_name}
                      className="size-12 rounded-full object-cover ring-2 ring-dusk-600"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full bg-dusk-800 text-xl ring-2 ring-dusk-600">
                      🧒
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-parchment group-hover:text-umber-200">
                      {child.display_name}
                    </p>
                    {child.grade ? (
                      <p className="text-xs text-parchment-muted">
                        Grade {child.grade}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="text-xs font-medium text-umber-400 group-hover:text-umber-300">
                  View portfolio →
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
