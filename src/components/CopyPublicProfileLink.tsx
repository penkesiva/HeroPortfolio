"use client";

import { useState } from "react";

function PublicProfileIcon({ className }: { className?: string }) {
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
      <path d="M18 21a6 6 0 0 0-12 0" />
      <circle cx="12" cy="8" r="3.5" />
      <path d="M14 14h5v5" />
      <path d="M14 19l7-7" />
    </svg>
  );
}

export function CopyPublicProfileLink({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copy() {
    setError(false);
    const url = `${window.location.origin}/p/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => void copy()}
        title="Copy share link"
        aria-label="Copy share link for your public profile"
        className="flex items-center gap-2 rounded-full border border-dusk-600 bg-dusk-850/90 px-3 py-1.5 text-xs font-medium text-parchment-muted transition hover:border-umber-400/45 hover:text-parchment"
      >
        <PublicProfileIcon className="size-4 shrink-0 text-umber-300/90" />
        <span className="hidden sm:inline">
          {copied ? "Copied" : error ? "Copy failed" : "Copy share link"}
        </span>
      </button>
      {copied ? (
        <span className="text-[10px] text-umber-300/90 sm:hidden">Copied</span>
      ) : null}
    </div>
  );
}
