"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
  /** Replaces the default footnote under the actions (e.g. “JSON export is free”). */
  footerNote?: string;
  /** Label for the primary action that goes to /pricing. */
  primaryCtaLabel?: string;
};

export function UpgradeModal({
  open,
  onClose,
  featureName,
  description,
  footerNote,
  primaryCtaLabel = "View plans & pricing",
}: Props) {
  const router = useRouter();
  const titleId = useId();
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setPortalEl(document.body);
  }, []);

  const goToPricing = useCallback(() => {
    onClose();
    router.push("/pricing");
  }, [onClose, router]);

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
          className="fixed inset-0 z-[220] flex min-h-0 items-center justify-center overflow-y-auto overscroll-contain p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
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
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative z-10 my-auto w-full max-h-[min(calc(100dvh-2rem),32rem)] max-w-md overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-umber-500/35 bg-gradient-to-b from-dusk-850/95 via-dusk-900 to-dusk-950 p-0 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_64px_rgba(0,0,0,0.55)] ring-1 ring-umber-400/20"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(200,150,80,0.12),transparent_50%)]" />
            <div className="relative p-7 sm:p-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-umber-500/30 bg-umber-500/15 text-2xl shadow-inner">
                <span className="select-none" aria-hidden>
                  ⭐
                </span>
              </div>
              <h2 id={titleId} className="text-lg font-semibold tracking-tight text-parchment sm:text-xl">
                {featureName} is a Pro feature
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-parchment-muted">
                {description ??
                  "Upgrade to HeroPortfolio Pro to unlock this and build a portfolio that stands out."}
              </p>
              <p className="mt-4 rounded-lg border border-dusk-600/60 bg-dusk-900/50 px-3.5 py-2.5 text-xs leading-snug text-parchment-muted/90">
                Continue to the pricing page to compare plans. You can return here anytime.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
                <button
                  type="button"
                  onClick={goToPricing}
                  className="inline-flex w-full items-center justify-center rounded-full border border-umber-500/50 bg-umber-500/30 py-3 text-sm font-semibold text-umber-50 shadow-sm transition hover:bg-umber-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber-300/60 sm:flex-1"
                >
                  {primaryCtaLabel}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex w-full items-center justify-center rounded-full border border-dusk-500/80 bg-dusk-850/50 py-3 text-sm font-medium text-parchment-muted transition hover:border-dusk-400 hover:text-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-400/50 sm:flex-1"
                >
                  Not now
                </button>
              </div>
              <p className="mt-5 text-center text-[11px] text-parchment-muted/75">
                {footerNote ?? "Basic stays free forever."}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!portalEl) return null;

  return createPortal(modal, portalEl);
}
