import Link from "next/link";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import {
  PORTFOLIO_PRIVATE_PAGE_MESSAGE,
  PORTFOLIO_PRIVATE_PAGE_TITLE,
} from "@/lib/constants";

export function PrivatePortfolioPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 text-parchment">
      <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <SiteBrandLink href="/" ariaLabel="HeroPortfolio home" />
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-parchment-muted hover:text-parchment"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dusk-600/80 bg-dusk-900/70 text-2xl">
          🔒
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
          {PORTFOLIO_PRIVATE_PAGE_TITLE}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-parchment-muted">
          {PORTFOLIO_PRIVATE_PAGE_MESSAGE}
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full border border-dusk-600 bg-dusk-850 px-5 py-2.5 text-sm font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment"
        >
          Back to HeroPortfolio
        </Link>
      </main>
    </div>
  );
}
