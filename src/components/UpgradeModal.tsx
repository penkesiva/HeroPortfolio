"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  featureName: string;
  description?: string;
};

export function UpgradeModal({ open, onClose, featureName, description }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade to Pro"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-dusk-950/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-umber-500/40 bg-gradient-to-b from-dusk-900 to-dusk-950 p-8 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-umber-500/20 text-xl">
              ⭐
            </div>
            <h2 className="text-lg font-semibold text-parchment">
              {featureName} is a Pro feature
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment-muted">
              {description ??
                "Upgrade to HeroPortfolio Pro to unlock this feature and build a portfolio that stands out."}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/pricing"
                className="block w-full rounded-full border border-umber-500/50 bg-umber-500/25 py-3 text-center text-sm font-semibold text-umber-100 transition hover:bg-umber-500/35"
              >
                Upgrade to Pro
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full border border-dusk-600 py-2.5 text-sm font-medium text-parchment-muted hover:text-parchment"
              >
                Maybe later
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] text-parchment-muted/70">
              Basic stays free forever.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
