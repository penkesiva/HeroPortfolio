"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PRO_MONTHLY = 4.99;
const PRO_YEARLY = 39.99;
const proYearlyEquivMonthly = (PRO_YEARLY / 12).toFixed(2);

const FAM_MONTHLY = 11.99;
const FAM_YEARLY = 89.99;
const famYearlyEquivMonthly = (FAM_YEARLY / 12).toFixed(2);

const FAM_MAILTO =
  "mailto:hello@heroportfolio.com?subject=Family%20Plan%20Interest&body=Hi%2C%20I%27d%20like%20to%20set%20up%20a%20Family%20plan%20for%20my%20household.";

type Props = {
  userPlan?: "free" | "pro";
  hasStripeCustomer?: boolean;
};

export function PricingPlansClient({
  userPlan = "free",
  hasStripeCustomer = false,
}: Props) {
  const [yearly, setYearly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpgrade = async (tier: "pro" | "family" = "pro") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: yearly ? "year" : "month", tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.");
        return;
      }
      router.push(data.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open billing portal.");
        return;
      }
      router.push(data.url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Billing toggle */}
      <div className="mb-7 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <span className="text-sm text-parchment-muted">Billing</span>
        <div
          className="inline-flex rounded-full border border-dusk-600 bg-dusk-850/80 p-1"
          role="group"
          aria-label="Billing period"
        >
          <button
            type="button"
            onClick={() => startTransition(() => setYearly(false))}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !yearly
                ? "bg-umber-500/25 text-umber-200 shadow-sm"
                : "text-parchment-muted hover:text-parchment"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => setYearly(true))}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              yearly
                ? "bg-umber-500/25 text-umber-200 shadow-sm"
                : "text-parchment-muted hover:text-parchment"
            }`}
          >
            Yearly
            <span className="ml-2 rounded-full bg-umber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-umber-300">
              Save 33%
            </span>
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-6 text-center text-sm text-red-400">{error}</p>
      )}

      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3 lg:gap-5">
        {/* ── Basic ── */}
        <article className="flex flex-col rounded-2xl border border-dusk-700/90 bg-dusk-900/40 p-5 shadow-lg sm:p-6">
          <h2 className="text-base font-semibold text-parchment">Basic</h2>
          <p className="mt-0.5 text-sm text-parchment-muted">
            Everything you need to publish a credible portfolio.
          </p>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-parchment">$0</span>
            <span className="text-sm text-parchment-muted">/ forever</span>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-parchment-muted">
            <Feature>
              <strong className="font-medium text-parchment/90">1 public portfolio</strong> with a shareable link
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Year-by-year timeline</strong>, up to 12 events per year
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">3 photos per event</strong> with album view
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">JSON export</strong> for backup
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">AI Smart Import</strong>, 2 free summaries per month
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Milestone badges</strong> earned automatically
            </Feature>
            <Feature>Light &amp; dark themes, video &amp; music embeds</Feature>
          </ul>
          {userPlan === "free" ? (
            <Link
              href="/signup"
              className="mt-6 block w-full rounded-full border border-dusk-600 bg-dusk-850 py-2.5 text-center text-sm font-semibold text-parchment transition hover:border-umber-500/45 hover:bg-dusk-800"
            >
              Start free
            </Link>
          ) : (
            <p className="mt-6 py-2.5 text-center text-sm font-medium text-parchment-muted">
              Your current plan
            </p>
          )}
        </article>

        {/* ── Pro ── */}
        <article className="relative flex flex-col rounded-2xl border border-umber-500/45 bg-gradient-to-b from-umber-500/10 to-dusk-900/50 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.35)] ring-1 ring-umber-500/20 sm:p-6">
          <span className="absolute right-4 top-4 rounded-full bg-umber-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-umber-200">
            Most popular
          </span>
          <h2 className="text-base font-semibold text-parchment">Pro</h2>
          <p className="mt-0.5 text-sm text-parchment-muted">
            For students building a college application portfolio.
          </p>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-parchment">
                {yearly ? `$${PRO_YEARLY.toFixed(2)}` : `$${PRO_MONTHLY.toFixed(2)}`}
              </span>
              <span className="text-sm text-parchment-muted">
                {yearly ? "/ year" : "/ month"}
              </span>
            </div>
            <p className="mt-1 text-xs text-parchment-muted/80">
              {yearly
                ? `~$${proYearlyEquivMonthly}/mo billed annually`
                : `Or $${PRO_YEARLY}/yr (save 33%)`}
            </p>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-parchment-muted">
            <Feature>
              <strong className="font-medium text-parchment/90">Everything in Basic</strong>
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Unlimited events</strong> + unlimited photos
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Full album</strong>, masonry gallery across all years
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">PDF Achievement Book</strong> + CSV export
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Unlimited AI Smart Import</strong>
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Profile analytics</strong>
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Pro badge</strong> + priority support
            </Feature>
          </ul>

          {userPlan === "pro" ? (
            <div className="mt-6 space-y-2">
              <p className="py-1.5 text-center text-sm font-medium text-umber-300">
                ✓ You are on Pro
              </p>
              {hasStripeCustomer && (
                <button
                  type="button"
                  onClick={() => void handleManage()}
                  disabled={loading}
                  className="w-full rounded-full border border-dusk-600 bg-dusk-850 py-2 text-sm font-medium text-parchment-muted transition hover:text-parchment disabled:opacity-50"
                >
                  {loading ? "Opening…" : "Manage subscription"}
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleUpgrade("pro")}
                disabled={loading}
                className="mt-6 w-full rounded-full border border-umber-500/50 bg-umber-500/25 py-2.5 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Redirecting…"
                  : `Upgrade to Pro  ${yearly ? `$${PRO_YEARLY}/yr` : `$${PRO_MONTHLY}/mo`}`}
              </button>
              <p className="mt-2 text-center text-[11px] text-parchment-muted">
                Stripe checkout · Cancel any time · One scholarship pays for 8+ yrs
              </p>
            </>
          )}
        </article>

        {/* ── Family ── */}
        <article className="relative flex flex-col rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-500/8 to-dusk-900/50 p-5 shadow-lg ring-1 ring-sky-500/15 sm:p-6">
          <span className="absolute right-4 top-4 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-300">
            Family
          </span>
          <h2 className="text-base font-semibold text-parchment">Family</h2>
          <p className="mt-0.5 text-sm text-parchment-muted">
            Up to 4 members, one simple bill.
          </p>
          <div className="mt-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-parchment">
                {yearly ? `$${FAM_YEARLY.toFixed(2)}` : `$${FAM_MONTHLY.toFixed(2)}`}
              </span>
              <span className="text-sm text-parchment-muted">
                {yearly ? "/ year" : "/ month"}
              </span>
            </div>
            <p className="mt-1 text-xs text-sky-300/80">
              {yearly
                ? `~$${famYearlyEquivMonthly}/mo · saves ~44% vs 4 individual Pros`
                : `Or $${FAM_YEARLY}/yr (save 37%)`}
            </p>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-parchment-muted">
            <Feature check="sky">
              <strong className="font-medium text-parchment/90">Full Pro for every member</strong>, up to 4 accounts
            </Feature>
            <Feature check="sky">
              <strong className="font-medium text-parchment/90">Parent overview dashboard</strong>
            </Feature>
            <Feature check="sky">
              <strong className="font-medium text-parchment/90">Shared family album</strong>
            </Feature>
            <Feature check="sky">
              <strong className="font-medium text-parchment/90">One bill, one login</strong>
            </Feature>
            <Feature check="sky">
              <strong className="font-medium text-parchment/90">Priority family support</strong> + early access
            </Feature>
          </ul>

          <a
            href={`${FAM_MAILTO}&body=Hi%2C%20I%27d%20like%20to%20set%20up%20a%20Family%20plan%20for%20${yearly ? "the%20yearly" : "the%20monthly"}%20option.`}
            className="mt-6 block w-full rounded-full border border-sky-500/40 bg-sky-500/15 py-2.5 text-center text-sm font-semibold text-sky-200 transition hover:bg-sky-500/25"
          >
            Get started with Family
          </a>
          <p className="mt-2 text-center text-[11px] text-parchment-muted">
            We&apos;ll set up accounts within 24 hrs · Dashboard launching Q3 2026
          </p>
        </article>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-parchment-muted">
        Prices in USD. Taxes may apply. Cancel Pro or Family any time; Basic stays free forever.
      </p>
    </div>
  );
}

function Feature({
  children,
  check = "umber",
}: {
  children: React.ReactNode;
  check?: "umber" | "sky";
}) {
  return (
    <li className="flex gap-2">
      <span
        className={`mt-0.5 shrink-0 ${check === "sky" ? "text-sky-400" : "text-umber-400"}`}
        aria-hidden
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
