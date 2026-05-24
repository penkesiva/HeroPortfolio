"use client";

import { useEffect, useId, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export type AppNoticeVariant = "success" | "error" | "info";

export type AppNoticeStat = {
  label: string;
  value: string | number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  variant?: AppNoticeVariant;
  title: string;
  message?: string;
  stats?: AppNoticeStat[];
  warnings?: string[];
  primaryLabel?: string;
};

const VARIANT_META: Record<
  AppNoticeVariant,
  {
    icon: ReactNode;
    accentBorder: string;
    accentRing: string;
    accentGlow: string;
    iconWrap: string;
    primaryBtn: string;
  }
> = {
  success: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-green-400/35" />
        <path
          d="M8 12.5 10.8 15.2 16 9.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-300"
        />
      </svg>
    ),
    accentBorder: "border-green-500/30",
    accentRing: "ring-green-400/15",
    accentGlow: "rgba(74,222,128,0.12)",
    iconWrap: "border-green-500/25 bg-green-500/10 text-green-200",
    primaryBtn:
      "border-green-500/45 bg-green-500/20 text-green-50 hover:bg-green-500/30 focus-visible:outline-green-300/60",
  },
  error: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-red-400/35" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-300" />
      </svg>
    ),
    accentBorder: "border-red-500/30",
    accentRing: "ring-red-400/15",
    accentGlow: "rgba(248,113,113,0.1)",
    iconWrap: "border-red-500/25 bg-red-500/10 text-red-200",
    primaryBtn:
      "border-red-500/40 bg-red-500/15 text-red-50 hover:bg-red-500/25 focus-visible:outline-red-300/60",
  },
  info: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-sky-400/35" />
        <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-sky-300" />
      </svg>
    ),
    accentBorder: "border-sky-500/30",
    accentRing: "ring-sky-400/15",
    accentGlow: "rgba(56,189,248,0.1)",
    iconWrap: "border-sky-500/25 bg-sky-500/10 text-sky-200",
    primaryBtn:
      "border-sky-500/40 bg-sky-500/15 text-sky-50 hover:bg-sky-500/25 focus-visible:outline-sky-300/60",
  },
};

/** Modern in-app notice — use instead of `window.alert` for user-facing results. */
export function AppNoticeDialog({
  open,
  onClose,
  variant = "info",
  title,
  message,
  stats,
  warnings,
  primaryLabel = "Done",
}: Props) {
  const titleId = useId();
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const meta = VARIANT_META[variant];

  useLayoutEffect(() => {
    setPortalEl(document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[230] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-dusk-950/85 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`relative z-10 my-auto w-full max-h-[min(calc(100dvh-2rem),36rem)] max-w-md overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border bg-gradient-to-b from-dusk-850/95 via-dusk-900 to-dusk-950 p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.55)] ring-1 ${meta.accentBorder} ${meta.accentRing}`}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(ellipse 120% 80% at 50% -20%, ${meta.accentGlow}, transparent 52%)`,
              }}
            />
            <div className="relative p-7 sm:p-8">
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner ${meta.iconWrap}`}
              >
                {meta.icon}
              </div>
              <h2 id={titleId} className="text-lg font-semibold tracking-tight text-parchment sm:text-xl">
                {title}
              </h2>
              {message ? (
                <p className="mt-2.5 text-sm leading-relaxed text-parchment-muted">{message}</p>
              ) : null}

              {stats && stats.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-dusk-600/70 bg-dusk-900/55 px-3.5 py-3 text-center"
                    >
                      <p className="text-2xl font-semibold tabular-nums tracking-tight text-parchment">
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-parchment-muted/70">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {warnings && warnings.length > 0 ? (
                <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                    Notes
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-relaxed text-parchment-muted/90">
                    {warnings.slice(0, 5).map((w) => (
                      <li key={w} className="flex gap-2">
                        <span className="text-amber-400/80" aria-hidden>
                          •
                        </span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`inline-flex w-full items-center justify-center rounded-full border py-3 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${meta.primaryBtn}`}
                >
                  {primaryLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!portalEl) return null;
  return createPortal(modal, portalEl);
}
