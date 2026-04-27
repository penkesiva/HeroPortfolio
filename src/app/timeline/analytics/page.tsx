import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BackToTimeline } from "@/components/BackToTimeline";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { getAnalyticsSummary, getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile analytics",
  description: "See how many people have viewed your public portfolio.",
};

export default async function AnalyticsPage() {
  if (!isSupabaseConfigured()) redirect("/");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline/analytics");

  const plan = await getUserPlan(supabase, user.id);
  const name = displayNameFromUser(user);

  // Stats and counts are Pro-only; free users see this page as an upgrade path.
  if (plan === "free") {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader userId={user.id} displayName={name} plan={plan} />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 text-center sm:px-6">
          <div className="mb-6 text-left">
            <BackToTimeline />
          </div>
          <div className="mb-6 text-5xl opacity-50">📊</div>
          <h1 className="text-2xl font-semibold text-parchment">Analytics is a Pro feature</h1>
          <p className="mt-3 text-parchment-muted">
            See exactly how many people are viewing your public portfolio, by week, month, and all time.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-block rounded-full border border-umber-500/50 bg-umber-500/20 px-8 py-3 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30"
          >
            Upgrade to Pro
          </Link>
        </main>
      </div>
    );
  }

  const analytics = await getAnalyticsSummary(supabase, user.id);

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/p/${user.id}`;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userId={user.id} displayName={name} plan={plan} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-2">
          <BackToTimeline />
        </div>
        <div className="mb-8 mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            Profile Analytics
          </h1>
          <p className="mt-2 text-sm text-parchment-muted">
            Views of your public portfolio at{" "}
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
            >
              {publicUrl}
            </a>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total views"
            value={analytics.totalViews}
            icon="👁"
          />
          <StatCard
            label="This month"
            value={analytics.viewsThisMonth}
            icon="📅"
          />
          <StatCard
            label="This week"
            value={analytics.viewsThisWeek}
            icon="📈"
          />
        </div>

        <div className="mt-10 rounded-2xl border border-dusk-700/60 bg-dusk-900/30 p-6">
          <h2 className="mb-3 text-sm font-semibold text-parchment">
            Tips to get more views
          </h2>
          <ul className="space-y-2 text-sm text-parchment-muted">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-umber-400">→</span>
              <span>Add your portfolio link to college applications and scholarship forms</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-umber-400">→</span>
              <span>Share it with coaches, teachers, and mentors after achievements</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-umber-400">→</span>
              <span>Include the link in email signatures and LinkedIn (if applicable)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-umber-400">→</span>
              <span>Ask a parent to share it in their network when you hit a milestone</span>
            </li>
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-parchment-muted/60">
          Views are counted anonymously. IP addresses are hashed and never stored in plain text.
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-dusk-700/60 bg-dusk-900/40 p-6">
      <div className="mb-3 text-2xl">{icon}</div>
      <p className="text-3xl font-semibold tracking-tight text-parchment">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-parchment-muted">{label}</p>
    </div>
  );
}
