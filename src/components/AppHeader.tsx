"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteBrandLink } from "@/components/SiteBrandLink";
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
        <SiteBrandLink
          href="/timeline"
          ariaLabel="HeroPortfolio.com: your timeline"
          onClick={() => {
            if (pathname === "/timeline") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        />

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/timeline/album"
            className="hidden text-sm font-medium text-parchment-muted transition hover:text-parchment sm:inline"
          >
            Album
          </Link>

          <Link
            href="/timeline/badges"
            className="hidden text-sm font-medium text-parchment-muted transition hover:text-parchment sm:inline"
          >
            Badges
          </Link>

          <Link
            href="/timeline/analytics"
            className="hidden items-center gap-1.5 text-sm font-medium text-parchment-muted transition hover:text-parchment sm:inline-flex"
          >
            <span>Analytics</span>
            {plan === "free" && (
              <span className="rounded-full bg-umber-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-umber-200">
                Pro
              </span>
            )}
          </Link>

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
