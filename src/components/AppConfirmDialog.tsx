"use client";

import { useEffect, useId, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export type AppConfirmVariant = "default" | "warning" | "danger";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant?: AppConfirmVariant;
  title: string;
  message?: string;
  /** Highlight box — e.g. backup reminder */
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
};

const VARIANT_META: Record<
  AppConfirmVariant,
  {
    icon: ReactNode;
    accentBorder: string;
    accentRing: string;
    accentGlow: string;
    iconWrap: string;
    confirmBtn: string;
  }
> = {
  default: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    accentBorder: "border-sky-500/30",
    accentRing: "ring-sky-400/15",
    accentGlow: "rgba(56,189,248,0.1)",
    iconWrap: "app-confirm-icon app-confirm-icon-default border-sky-500/25 bg-sky-500/10 text-sky-300",
    confirmBtn:
      "app-confirm-btn app-confirm-btn-default border-sky-500/40 bg-sky-500/15 text-sky-50 hover:bg-sky-500/25 focus-visible:outline-sky-300/60",
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
        <path
          d="M12 3.5 20.5 19.5H3.5L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.5"
        />
        <path d="M12 9v5M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    accentBorder: "border-amber-500/35",
    accentRing: "ring-amber-400/15",
    accentGlow: "rgba(245,158,11,0.12)",
    iconWrap: "app-confirm-icon app-confirm-icon-warning border-amber-500/30 bg-amber-500/10 text-amber-200",
    confirmBtn:
      "app-confirm-btn app-confirm-btn-warning border-amber-500/45 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30 focus-visible:outline-amber-300/60",
  },
  danger: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    accentBorder: "border-red-500/30",
    accentRing: "ring-red-400/15",
    accentGlow: "rgba(248,113,113,0.1)",
    iconWrap: "app-confirm-icon app-confirm-icon-danger border-red-500/25 bg-red-500/10 text-red-300",
    confirmBtn:
      "app-confirm-btn app-confirm-btn-danger border-red-500/40 bg-red-500/15 text-red-50 hover:bg-red-500/25 focus-visible:outline-red-300/60",
  },
};

/** Modern confirmation — use instead of `window.confirm`. */
export function AppConfirmDialog({
  open,
  onClose,
  onConfirm,
  variant = "default",
  title,
  message,
  note,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  loading = false,
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
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[235] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Close"
            disabled={loading}
            className="app-notice-backdrop absolute inset-0 bg-dusk-950/85 backdrop-blur-md disabled:cursor-not-allowed"
            onClick={loading ? undefined : onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`app-notice-panel relative z-10 my-auto w-full max-h-[min(calc(100dvh-2rem),36rem)] max-w-md overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border bg-gradient-to-b from-dusk-850/95 via-dusk-900 to-dusk-950 p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.55)] ring-1 ${meta.accentBorder} ${meta.accentRing}`}
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
              {note ? (
                <p className="app-confirm-note mt-4 rounded-xl border border-dusk-600/70 bg-dusk-900/55 px-3.5 py-3 text-xs leading-relaxed text-parchment-muted">
                  {note}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirm();
                  }}
                  className={`inline-flex w-full items-center justify-center rounded-full border py-3 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1 ${meta.confirmBtn}`}
                >
                  {loading ? "Working…" : confirmLabel}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="app-confirm-cancel inline-flex w-full items-center justify-center rounded-full border border-dusk-600 bg-dusk-850/80 py-3 text-sm font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-400/50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  {cancelLabel}
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
