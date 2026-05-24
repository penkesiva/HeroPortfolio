"use client";

import {
  FREE_AI_LABEL,
  FREE_PORTFOLIO_LIMIT,
  PRICES,
  PRICING_FREE_PLAN_TAGLINE_GUARDIAN,
  PRICING_FREE_PLAN_TAGLINE_SELF,
  PRICING_STUDENT_PRO_TAGLINE,
} from "@/lib/constants";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AccountKind } from "@/types/database";

const STUDENT_MONTHLY = PRICES.studentPro.monthly;
const STUDENT_YEARLY = PRICES.studentPro.yearly;
const studentYearlyEquivMonthly = (STUDENT_YEARLY / 12).toFixed(2);

const PARENT_PER_CHILD_MONTHLY = PRICES.parentPro.perChildMonthly;
const PARENT_PER_CHILD_YEARLY = PRICES.parentPro.perChildYearly;
const parentYearlyEquivMonthly = (PARENT_PER_CHILD_YEARLY / 12).toFixed(2);

type Props = {
  userPlan?: "free" | "pro";
  accountKind?: AccountKind | null;
  hasStripeCustomer?: boolean;
  isLoggedIn?: boolean;
};

export function PricingPlansClient({
  userPlan = "free",
  accountKind = null,
  hasStripeCustomer = false,
  isLoggedIn = false,
}: Props) {
  const [yearly, setYearly] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<null | "pro" | "parent_pro">(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkoutBusy = checkoutTier !== null;
  const anyBillingBusy = checkoutBusy || portalLoading;

  const signupForPricingHref = `/signup?next=${encodeURIComponent("/pricing")}`;

  // Determine which Pro card to show:
  // guardian → Parent Pro; self or unknown → Student Pro
  const isGuardian = accountKind === "guardian";

  const handleUpgrade = async (tier: "pro" | "parent_pro" = "pro") => {
    if (!isLoggedIn) {
      router.push(signupForPricingHref);
      return;
    }
    setCheckoutTier(tier);
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
      setCheckoutTier(null);
    }
  };

  const handleManage = async () => {
    if (!isLoggedIn) {
      router.push(signupForPricingHref);
      return;
    }
    setPortalLoading(true);
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
      setPortalLoading(false);
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

      <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-2 lg:gap-6">
        {/* ── Free ── */}
        <article className="flex flex-col rounded-2xl border border-dusk-700/90 bg-dusk-900/40 p-5 shadow-lg sm:p-6">
          <h2 className="text-base font-semibold text-parchment">Free</h2>
          <p className="mt-0.5 text-sm text-parchment-muted">
            {isGuardian ? PRICING_FREE_PLAN_TAGLINE_GUARDIAN : PRICING_FREE_PLAN_TAGLINE_SELF}
          </p>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-parchment">$0</span>
            <span className="text-sm text-parchment-muted">/ forever</span>
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-parchment-muted">
            {isGuardian ? (
              <>
                <Feature>
                  <strong className="font-medium text-parchment/90">Up to {FREE_PORTFOLIO_LIMIT} child portfolios</strong>
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">Year-by-year timeline</strong>, up to 12 events per year per child
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">1 photo per event</strong>
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">AI Smart Import</strong>, {FREE_AI_LABEL}
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">Milestone badges</strong> earned automatically
                </Feature>
              </>
            ) : (
              <>
                <Feature>
                  <strong className="font-medium text-parchment/90">Up to {FREE_PORTFOLIO_LIMIT} portfolios</strong>
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">Public or private sharing</strong> per portfolio
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">Year-by-year timeline</strong>, up to 12 events per year
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">1 photo per event</strong>
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">AI Smart Import</strong>, {FREE_AI_LABEL}
                </Feature>
                <Feature>
                  <strong className="font-medium text-parchment/90">Milestone badges</strong> earned automatically
                </Feature>
                <Feature>JSON export · video &amp; music embeds</Feature>
              </>
            )}
          </ul>
          {userPlan === "free" && isLoggedIn ? (
            <p className="mt-6 py-2.5 text-center text-sm font-medium text-parchment-muted">
              ✓ Your current plan
            </p>
          ) : userPlan === "free" ? (
            <Link
              href={signupForPricingHref}
              className="mt-6 block w-full rounded-full border border-dusk-600 bg-dusk-850 py-2.5 text-center text-sm font-semibold text-parchment transition hover:border-umber-500/45 hover:bg-dusk-800"
            >
              Start free
            </Link>
          ) : (
            <p className="mt-6 py-2.5 text-center text-sm font-medium text-parchment-muted">
              ✓ Included in your plan
            </p>
          )}
        </article>

        {/* ── Pro card — Student or Parent depending on account_kind ── */}
        <article className="relative flex flex-col rounded-2xl border border-umber-500/45 bg-gradient-to-b from-umber-500/10 to-dusk-900/50 p-5 shadow-[0_24px_64px_rgba(0,0,0,0.35)] ring-1 ring-umber-500/20 sm:p-6">
          <span className="absolute right-4 top-4 rounded-full bg-umber-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-umber-200">
            Most popular
          </span>
          <h2 className="text-base font-semibold text-parchment">
            {isGuardian ? "Parent Pro" : "Student Pro"}
          </h2>
          <p className="mt-0.5 text-sm text-parchment-muted">
            {isGuardian
              ? "Unlimited children, all Pro features for your whole family."
              : PRICING_STUDENT_PRO_TAGLINE}
          </p>
          <div className="mt-4">
            {isGuardian ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-parchment">
                    {yearly ? `$${PARENT_PER_CHILD_YEARLY.toFixed(2)}` : `$${PARENT_PER_CHILD_MONTHLY.toFixed(2)}`}
                  </span>
                  <span className="text-sm text-parchment-muted">
                    / child / {yearly ? "year" : "month"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-parchment-muted/80">
                  {yearly
                    ? `~$${parentYearlyEquivMonthly}/child/mo billed annually`
                    : `Or $${PARENT_PER_CHILD_YEARLY}/child/yr (save 33%)`}
                </p>
                <p className="mt-1 text-xs text-parchment-muted/60">
                  Example: 3 children = ${yearly
                    ? (PARENT_PER_CHILD_YEARLY * 3).toFixed(2) + "/yr"
                    : (PARENT_PER_CHILD_MONTHLY * 3).toFixed(2) + "/mo"}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-parchment">
                    {yearly ? `$${STUDENT_YEARLY.toFixed(2)}` : `$${STUDENT_MONTHLY.toFixed(2)}`}
                  </span>
                  <span className="text-sm text-parchment-muted">
                    {yearly ? "/ year" : "/ month"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-parchment-muted/80">
                  {yearly
                    ? `~$${studentYearlyEquivMonthly}/mo billed annually`
                    : `Or $${STUDENT_YEARLY}/yr (save 33%)`}
                </p>
              </>
            )}
          </div>
          <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-parchment-muted">
            <Feature>
              <strong className="font-medium text-parchment/90">Everything in Free</strong>
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">
                {isGuardian ? "Unlimited child portfolios" : "Unlimited portfolios"}
              </strong>
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Unlimited events</strong> + unlimited photos
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
              <strong className="font-medium text-parchment/90">Audio uploads</strong> + full album gallery
            </Feature>
            <Feature>
              <strong className="font-medium text-parchment/90">Priority support</strong>
            </Feature>
          </ul>

          {userPlan === "pro" ? (
            <div className="mt-6 space-y-2">
              <p className="py-1.5 text-center text-sm font-medium text-umber-300">
                ✓ You are on {isGuardian ? "Parent Pro" : "Student Pro"}
              </p>
              {hasStripeCustomer && (
                <button
                  type="button"
                  onClick={() => void handleManage()}
                  disabled={anyBillingBusy}
                  className="w-full rounded-full border border-dusk-600 bg-dusk-850 py-2 text-sm font-medium text-parchment-muted transition hover:text-parchment disabled:opacity-50"
                >
                  {portalLoading ? "Opening…" : "Manage subscription"}
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleUpgrade(isGuardian ? "parent_pro" : "pro")}
                disabled={anyBillingBusy}
                className="mt-6 w-full rounded-full border border-umber-500/50 bg-umber-500/25 py-2.5 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutTier !== null
                  ? "Redirecting…"
                  : isGuardian
                    ? `Upgrade to Parent Pro · ${yearly ? `$${PARENT_PER_CHILD_YEARLY}/child/yr` : `$${PARENT_PER_CHILD_MONTHLY}/child/mo`}`
                    : `Upgrade to Student Pro · ${yearly ? `$${STUDENT_YEARLY}/yr` : `$${STUDENT_MONTHLY}/mo`}`}
              </button>
              <p className="mt-2 text-center text-[11px] text-parchment-muted">
                Cancel any time · No hidden fees
              </p>
            </>
          )}
        </article>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-parchment-muted">
        Prices in USD. Taxes may apply. Cancel any time; Free plan stays free forever.
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
        className={`mt-0.5 shrink-0 ${check === "sky" ? "family-check" : "text-umber-400"}`}
        aria-hidden
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
