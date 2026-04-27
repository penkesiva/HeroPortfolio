import Link from "next/link";

/** Full-page upgrade CTA: goes straight to `/pricing` (no dialog). */
export function AnalyticsFreeUpgradeCta() {
  return (
    <Link
      href="/pricing"
      className="mt-8 inline-block rounded-full border border-umber-500/50 bg-umber-500/20 px-8 py-3 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30"
    >
      Upgrade to Pro
    </Link>
  );
}
