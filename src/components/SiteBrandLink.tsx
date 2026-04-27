"use client";

import type { MouseEventHandler } from "react";
import Link from "next/link";

export type SiteBrandLinkProps = {
  href: string;
  /** Accessible name for the home / timeline link. */
  ariaLabel: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

/**
 * HeroPortfolio wordmark + star icon — same presentation as AppHeader and marketing headers.
 */
export function SiteBrandLink({ href, ariaLabel, onClick }: SiteBrandLinkProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 transition"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-umber-500/20 ring-1 ring-umber-500/30 transition group-hover:bg-umber-500/30">
        <svg viewBox="0 0 16 16" className="size-5 fill-umber-300" aria-hidden>
          <path d="M8 1.5 9.6 5.8l4.6.4-3.4 3 1 4.4L8 11.2l-3.8 2.4 1-4.4-3.4-3 4.6-.4z" />
        </svg>
      </span>
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
  );
}
