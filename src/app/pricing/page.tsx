import type { Metadata } from "next";
import Link from "next/link";
import { PricingPlansClient } from "@/components/PricingPlansClient";

export const metadata: Metadata = {
  title: "Plans & pricing",
  description:
    "HeroPortfolio Basic is free. Pro adds support, higher limits, and upcoming insights for $0.99/mo or $9.99/yr.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col text-parchment">
      <header className="border-b border-dusk-700/70 bg-dusk-950/40 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-parchment transition hover:text-umber-200"
          >
            HeroPortfolio.com
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-parchment-muted transition hover:text-parchment sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-umber-500/45 bg-umber-500/15 px-4 py-2 text-sm font-medium text-umber-200 transition hover:bg-umber-500/25"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
          Pricing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Plans that match how you apply
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-parchment-muted sm:text-[17px]">
          Start free with a full portfolio. Upgrade to Pro when you want faster
          help, more room for media in the editor, and upcoming perks like view
          insights on your public link.
        </p>

        <div className="mt-12">
          <PricingPlansClient />
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center text-xs leading-relaxed text-parchment-muted">
          Prices in USD. Taxes may apply. You can cancel Pro any time; Basic
          stays free. Questions? Use the contact channel we add to your account
          after sign-up.
        </p>
      </main>
    </div>
  );
}
