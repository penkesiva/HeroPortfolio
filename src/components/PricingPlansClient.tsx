"use client";

import { startTransition, useState } from "react";
import Link from "next/link";

const MONTHLY = 0.99;
const YEARLY = 9.99;
const yearlyEquivMonthly = YEARLY / 12;

export function PricingPlansClient() {
  const [yearly, setYearly] = useState(true);

  return (
    <div className="w-full">
      <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
              Save ~16%
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2 lg:gap-8">
        <article className="flex flex-col rounded-2xl border border-dusk-700/90 bg-dusk-900/40 p-6 shadow-lg sm:p-8">
          <h2 className="text-lg font-semibold text-parchment">Basic</h2>
          <p className="mt-1 text-sm text-parchment-muted">
            Everything you need to publish a credible portfolio.
          </p>
          <p className="mt-6">
            <span className="text-4xl font-semibold tracking-tight text-parchment">
              $0
            </span>
            <span className="text-parchment-muted"> / forever</span>
          </p>
          <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-parchment-muted">
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                One portfolio with a <strong className="font-medium text-parchment/90">shareable public link</strong> for coaches, programs, and family
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Year-by-year timeline</strong> — milestones, photos, video &amp; music embeds, external links
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Edit content</strong> with local drafts and JSON export for Git
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Filters</strong> by category and media type on your timeline
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Light &amp; dark</strong> themes and secure sign-in
              </span>
            </li>
          </ul>
          <Link
            href="/signup"
            className="mt-8 block w-full rounded-full border border-dusk-600 bg-dusk-850 py-3 text-center text-sm font-semibold text-parchment transition hover:border-umber-500/45 hover:bg-dusk-800"
          >
            Start free
          </Link>
        </article>

        <article className="relative flex flex-col rounded-2xl border border-umber-500/45 bg-gradient-to-b from-umber-500/10 to-dusk-900/50 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.35)] ring-1 ring-umber-500/20 sm:p-8">
          <span className="absolute right-5 top-5 rounded-full bg-umber-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-umber-200">
            Pro
          </span>
          <h2 className="text-lg font-semibold text-parchment">Pro</h2>
          <p className="mt-1 text-sm text-parchment-muted">
            For students who want polish, support, and room to grow.
          </p>
          <p className="mt-6">
            {yearly ? (
              <>
                <span className="text-4xl font-semibold tracking-tight text-parchment">
                  ${YEARLY.toFixed(2)}
                </span>
                <span className="text-parchment-muted"> / year</span>
                <span className="mt-2 block text-sm text-parchment-muted">
                  About{" "}
                  <strong className="font-medium text-umber-300/95">
                    ${yearlyEquivMonthly.toFixed(2)}
                  </strong>{" "}
                  / month, billed annually
                </span>
              </>
            ) : (
              <>
                <span className="text-4xl font-semibold tracking-tight text-parchment">
                  ${MONTHLY.toFixed(2)}
                </span>
                <span className="text-parchment-muted"> / month</span>
                <span className="mt-2 block text-sm text-umber-300/90">
                  Or ${YEARLY.toFixed(2)}/year — switch to yearly above
                </span>
              </>
            )}
          </p>
          <ul className="mt-8 flex flex-1 flex-col gap-3 text-sm text-parchment-muted">
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Everything in Basic</strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Priority email support</strong>{" "}
                — faster answers when something breaks or you need setup help
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Higher editor limits</strong>{" "}
                — more headroom for hero images and timeline drafts in the browser
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Profile insights</strong>{" "}
                — see how often your public link is opened (rolling out next)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-umber-400" aria-hidden>
                ✓
              </span>
              <span>
                <strong className="font-medium text-parchment/90">Pro badge</strong> on your shared
                page, plus <strong className="font-medium text-parchment/90">early access</strong> to
                new layouts and export options
              </span>
            </li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-8 w-full cursor-not-allowed rounded-full border border-umber-500/35 bg-umber-500/20 py-3 text-sm font-semibold text-umber-200/80 opacity-90"
            title="Checkout is almost ready"
          >
            Upgrade to Pro — coming soon
          </button>
          <p className="mt-3 text-center text-[11px] text-parchment-muted">
            Secure checkout (card / wallet) will go live here. Want Pro first?{" "}
            <Link
              href="/signup"
              className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
            >
              Create an account
            </Link>{" "}
            and we&apos;ll email you when billing opens.
          </p>
        </article>
      </div>
    </div>
  );
}
