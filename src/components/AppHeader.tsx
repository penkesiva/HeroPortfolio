"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TimelineAccountMenu } from "@/components/TimelineAccountMenu";

interface AppHeaderProps {
  userId: string;
  displayName: string;
  plan: "free" | "pro";
}

/**
 * Shared sticky header used on timeline, album, analytics, and pricing pages.
 * Matches the timeline page header exactly — logo left, nav + avatar right.
 */
export function AppHeader({ userId, displayName, plan }: AppHeaderProps) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <Link
          href="/timeline"
          className="group flex items-center gap-2 transition"
          aria-label="HeroPortfolio.com — your timeline"
          onClick={() => {
            if (pathname === "/timeline") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          {/* Icon mark */}
          <span className="flex size-9 items-center justify-center rounded-xl bg-umber-500/20 ring-1 ring-umber-500/30 transition group-hover:bg-umber-500/30">
            <svg
              viewBox="0 0 16 16"
              className="size-5 fill-umber-300"
              aria-hidden
            >
              <path d="M8 1.5 9.6 5.8l4.6.4-3.4 3 1 4.4L8 11.2l-3.8 2.4 1-4.4-3.4-3 4.6-.4z" />
            </svg>
          </span>

          {/* Wordmark */}
          <span className="text-base leading-none">
            <span className="text-lg font-bold tracking-tight text-parchment transition group-hover:text-umber-200">
              Hero
            </span>
            <span className="text-lg font-semibold tracking-tight text-parchment/75 transition group-hover:text-umber-200/75">
              Portfolio
            </span>
            <span className="text-xs font-normal text-parchment-muted/50 transition group-hover:text-umber-300/60">
              .com
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/timeline/album"
            className="hidden text-sm font-medium text-parchment-muted transition hover:text-parchment sm:inline"
          >
            Album
          </Link>

          {plan === "pro" && (
            <Link
              href="/timeline/analytics"
              className="hidden text-sm font-medium text-parchment-muted transition hover:text-parchment sm:inline"
            >
              Analytics
            </Link>
          )}

          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-full border border-umber-500/35 bg-umber-500/10 px-3 py-1.5 text-sm transition hover:border-umber-400/50 hover:bg-umber-500/18"
          >
            <span className="font-medium text-umber-200">Plans</span>
            {plan === "free" && (
              <span className="rounded-full bg-umber-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-umber-200">
                Pro
              </span>
            )}
            {plan === "pro" && (
              <span className="rounded-full bg-umber-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-umber-100">
                ✓ Pro
              </span>
            )}
          </Link>

          <TimelineAccountMenu
            userId={userId}
            displayName={displayName}
            plan={plan}
          />
        </div>
      </div>
    </header>
  );
}
