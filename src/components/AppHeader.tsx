"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderPlanCta } from "@/components/HeaderPlanCta";
import { SiteBrandLink } from "@/components/SiteBrandLink";
import { TimelineAccountMenu } from "@/components/TimelineAccountMenu";

interface AppHeaderProps {
  userId: string;
  displayName: string;
  plan: "free" | "pro";
  /** Hero profile photo; center-cropped in the account icon when set. */
  avatarSrc?: string | null;
  avatarAlt?: string;
  portfolioIsPublic?: boolean;
}

/**
 * Shared sticky header used on timeline, album, analytics, and pricing pages.
 * Matches the timeline page header exactly — logo left, nav + avatar right.
 */
export function AppHeader({
  userId,
  displayName,
  plan,
  avatarSrc = null,
  avatarAlt = "",
  portfolioIsPublic = false,
}: AppHeaderProps) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-dusk-700/80 bg-dusk-950/85 backdrop-blur-md">
      {/* Main row */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <SiteBrandLink
          href="/portfolios"
          ariaLabel="HeroPortfolio.com: my portfolios"
          onClick={() => {
            if (pathname === "/portfolios" || pathname.startsWith("/portfolios/")) {
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

          <HeaderPlanCta plan={plan} />

          <TimelineAccountMenu
            userId={userId}
            displayName={displayName}
            plan={plan}
            avatarSrc={avatarSrc}
            avatarAlt={avatarAlt}
            portfolioIsPublic={portfolioIsPublic}
          />
        </div>
      </div>

      {/* Mobile sub-nav: visible only on small screens */}
      <nav
        aria-label="Section navigation"
        className="flex items-center gap-1 overflow-x-auto border-t border-dusk-800/60 px-4 pb-2 pt-1 sm:hidden"
      >
        <Link
          href="/timeline"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            pathname === "/timeline"
              ? "bg-dusk-800 text-parchment"
              : "text-parchment-muted hover:text-parchment"
          }`}
        >
          Timeline
        </Link>
        <Link
          href="/timeline/album"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            pathname === "/timeline/album"
              ? "bg-dusk-800 text-parchment"
              : "text-parchment-muted hover:text-parchment"
          }`}
        >
          Album
        </Link>
        <Link
          href="/timeline/badges"
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            pathname === "/timeline/badges"
              ? "bg-dusk-800 text-parchment"
              : "text-parchment-muted hover:text-parchment"
          }`}
        >
          Badges
        </Link>
        <Link
          href="/timeline/analytics"
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            pathname === "/timeline/analytics"
              ? "bg-dusk-800 text-parchment"
              : "text-parchment-muted hover:text-parchment"
          }`}
        >
          Analytics
          {plan === "free" && (
            <span className="rounded-full bg-umber-500/25 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-umber-200">
              Pro
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
