"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title: string;
  detail?: string;
};

/** Full-screen progress while portfolio JSON import or export runs. */
export function PortfolioTransferProgress({ open, title, detail }: Props) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-dusk-950/75 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-dusk-600/90 bg-dusk-900/95 px-5 py-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-3">
          <DotLottieReact
            src="/animations/sandy_loading.lottie"
            autoplay
            loop
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-parchment">{title}</p>
            {detail ? (
              <p className="mt-0.5 text-xs leading-relaxed text-parchment-muted">{detail}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-dusk-800">
          <div className="portfolio-transfer-bar h-full w-1/3 rounded-full bg-umber-400/85" />
        </div>
        <p className="mt-3 text-center text-[10px] text-parchment-muted/55">
          Please keep this tab open…
        </p>
      </div>
    </div>,
    document.body,
  );
}
