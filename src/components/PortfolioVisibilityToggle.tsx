"use client";

import { useTransition, type ReactNode } from "react";
import { setPortfolioVisibilityAction } from "@/app/actions/portfolio";
import { CopyPortfolioShareLink } from "@/components/portfolios/CopyPortfolioShareLink";
import {
  PORTFOLIO_VISIBILITY_PRIVATE_HINT,
  PORTFOLIO_VISIBILITY_PRIVATE_LABEL,
  PORTFOLIO_VISIBILITY_PUBLIC_HINT,
  PORTFOLIO_VISIBILITY_PUBLIC_LABEL,
} from "@/lib/constants";

type Props = {
  portfolioUserId: string;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  /** Menu-style segmented control vs card footer */
  variant?: "menu" | "card";
};

export function PortfolioVisibilityToggle({
  portfolioUserId,
  isPublic,
  onIsPublicChange,
  variant = "menu",
}: Props) {
  const [pending, startTransition] = useTransition();

  function setVisibility(next: boolean) {
    if (pending || next === isPublic) return;
    startTransition(async () => {
      const result = await setPortfolioVisibilityAction(next, portfolioUserId);
      if (!result.error) onIsPublicChange(next);
    });
  }

  const hint = isPublic
    ? PORTFOLIO_VISIBILITY_PUBLIC_HINT
    : PORTFOLIO_VISIBILITY_PRIVATE_HINT;

  if (variant === "card") {
    return (
      <div
        className="mt-3 border-t border-dusk-700/60 pt-3"
        onClick={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-parchment-muted/60">
          Sharing
        </p>
        <SegmentedControl
          isPublic={isPublic}
          pending={pending}
          onSelect={setVisibility}
          compact
        />
        {isPublic ? (
          <CopyPortfolioShareLink portfolioUserId={portfolioUserId} className="mt-3" />
        ) : null}
        <p className="mt-2.5 text-[10px] leading-relaxed text-parchment-muted/70">{hint}</p>
      </div>
    );
  }

  return (
    <div>
      <SegmentedControl
        isPublic={isPublic}
        pending={pending}
        onSelect={setVisibility}
      />
      <p className="mt-1.5 text-[10px] leading-relaxed text-parchment-muted/50">{hint}</p>
    </div>
  );
}

/** Compact badge for child cards — matches the switch icons. */
export function PortfolioVisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
        isPublic
          ? "portfolio-visibility-badge-public"
          : "portfolio-visibility-badge-private"
      }`}
    >
      {isPublic ? (
        <UnlockIcon className="size-2.5 shrink-0 opacity-90" />
      ) : (
        <LockIcon className="size-2.5 shrink-0 opacity-80" />
      )}
      {isPublic ? PORTFOLIO_VISIBILITY_PUBLIC_LABEL : PORTFOLIO_VISIBILITY_PRIVATE_LABEL}
    </span>
  );
}

function SegmentedControl({
  isPublic,
  pending,
  onSelect,
  compact = false,
}: {
  isPublic: boolean;
  pending: boolean;
  onSelect: (value: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`portfolio-visibility-switch relative flex w-full min-w-0 items-stretch overflow-hidden rounded-full border border-dusk-600 bg-dusk-900/70 p-0.5 shadow-inner ${
        compact ? "h-8" : "h-9"
      }`}
      aria-busy={pending}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-[transform,background-color,box-shadow] duration-200 ease-out ${
          isPublic
            ? "portfolio-visibility-pill-public translate-x-full bg-umber-500/25 ring-1 ring-umber-500/35"
            : "portfolio-visibility-pill-private translate-x-0 bg-dusk-700/95 ring-1 ring-dusk-500/50"
        }`}
      />
      <SegmentButton
        active={!isPublic}
        disabled={pending}
        compact={compact}
        onClick={() => onSelect(false)}
        icon={<LockIcon className="size-3.5 shrink-0" />}
        label={PORTFOLIO_VISIBILITY_PRIVATE_LABEL}
        activeClassName="text-parchment"
        idleClassName="text-parchment-muted/75 hover:text-parchment-muted"
      />
      <SegmentButton
        active={isPublic}
        disabled={pending}
        compact={compact}
        onClick={() => onSelect(true)}
        icon={<UnlockIcon className="size-3.5 shrink-0" />}
        label={PORTFOLIO_VISIBILITY_PUBLIC_LABEL}
        activeClassName="text-umber-50"
        idleClassName="text-parchment-muted/75 hover:text-umber-200/80"
      />
    </div>
  );
}

function SegmentButton({
  active,
  disabled,
  compact,
  onClick,
  icon,
  label,
  activeClassName,
  idleClassName,
}: {
  active: boolean;
  disabled: boolean;
  compact: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  activeClassName: string;
  idleClassName: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`relative z-[1] box-border flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-semibold leading-tight transition-colors duration-200 sm:gap-2 sm:text-xs ${
        active ? activeClassName : idleClassName
      } disabled:cursor-not-allowed disabled:opacity-55`}
    >
      <span
        className={`flex shrink-0 items-center justify-center transition-transform duration-200 ${
          active ? "scale-110" : "scale-100 opacity-70"
        } ${compact ? "" : ""}`}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UnlockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-1" />
    </svg>
  );
}
