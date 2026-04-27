"use client";

import Link from "next/link";

type Plan = "free" | "pro";

type Props = {
  plan: Plan;
};

/**
 * Free users: **Upgrade** goes straight to `/pricing` (no dialog — not blocking draft work elsewhere).
 * Pro users: compact link to plans/billing.
 */
export function HeaderPlanCta({ plan }: Props) {
  if (plan === "pro") {
    return (
      <Link
        href="/pricing"
        className="flex items-center rounded-full border border-umber-500/40 bg-umber-500/20 px-3 py-1.5 text-sm font-semibold text-umber-100 transition hover:border-umber-400/55 hover:bg-umber-500/28"
        title="View plans and billing"
      >
        Pro
      </Link>
    );
  }

  return (
    <Link
      href="/pricing"
      className="rounded-full border border-umber-500/50 bg-umber-500/30 px-3 py-1.5 text-sm font-semibold text-umber-50 shadow-sm transition hover:border-umber-400/60 hover:bg-umber-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber-300/50"
      title="View plans and upgrade to Pro"
    >
      Upgrade
    </Link>
  );
}
