"use client";

import { useEffect, useState } from "react";

export function UpgradedBanner() {
  const [visible, setVisible] = useState(true);

  // Strip ?upgraded=1 from the address bar without a Next.js navigation.
  // router.replace() refetches RSC and the server drops this banner — it vanished in <1s.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("upgraded")) {
      url.searchParams.delete("upgraded");
      const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
      window.history.replaceState(window.history.state, "", next);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mt-4 flex w-full max-w-6xl items-start justify-between gap-3 rounded-xl border border-umber-500/40 bg-umber-500/15 px-4 py-3 shadow-sm sm:items-center sm:px-6"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden>⭐</span>
        <div>
          <p className="text-sm font-semibold text-umber-100">
            Welcome to Pro!
          </p>
          <p className="text-xs text-parchment-muted">
            All Pro features are now unlocked — unlimited events, PDF export, CSV, and analytics.
          </p>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
        className="shrink-0 rounded-full p-1 text-parchment-muted transition hover:text-parchment"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden>
          <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  );
}
