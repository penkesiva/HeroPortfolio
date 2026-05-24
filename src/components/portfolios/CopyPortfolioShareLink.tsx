"use client";

import { useState } from "react";
import {
  PORTFOLIO_COPIED_SHARE_LINK_LABEL,
  PORTFOLIO_COPY_SHARE_LINK_FAILED_LABEL,
  PORTFOLIO_COPY_SHARE_LINK_LABEL,
} from "@/lib/constants";

type Props = {
  portfolioUserId: string;
  className?: string;
};

function LinkShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 14h5v5" />
      <path d="M14 19l7-7" />
      <path d="M10 4H5v5" />
      <path d="M10 9 3 3" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function CopyPortfolioShareLink({ portfolioUserId, className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError(false);
    const url = `${window.location.origin}/p/${portfolioUserId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 2800);
    }
  }

  const label = copied
    ? PORTFOLIO_COPIED_SHARE_LINK_LABEL
    : error
      ? PORTFOLIO_COPY_SHARE_LINK_FAILED_LABEL
      : PORTFOLIO_COPY_SHARE_LINK_LABEL;

  const stateClass = copied ? "is-copied" : error ? "is-error" : "";

  return (
    <button
      type="button"
      onClick={(e) => void copy(e)}
      onMouseDown={(e) => e.stopPropagation()}
      className={`portfolio-copy-link group/copy flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-xs font-semibold transition duration-200 ${stateClass} ${className}`}
    >
      {copied ? (
        <CheckIcon className="size-3.5 shrink-0" />
      ) : (
        <LinkShareIcon className="size-3.5 shrink-0 opacity-90 transition group-hover/copy:opacity-100" />
      )}
      <span>{label}</span>
    </button>
  );
}
