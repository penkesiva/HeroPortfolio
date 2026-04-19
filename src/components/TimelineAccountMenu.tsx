"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  applyTheme,
  getDocumentTheme,
  type ThemeChoice,
} from "@/lib/themePreference";

function UserAvatarIcon({ className }: { className?: string }) {
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
    </svg>
  );
}

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

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

type Props = {
  userId: string;
  displayName: string;
  plan?: "free" | "pro";
};

export function TimelineAccountMenu({ userId, displayName, plan = "free" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>("dark");
  const [themeMounted, setThemeMounted] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    startTransition(() => {
      setTheme(getDocumentTheme());
      setThemeMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setTheme(getDocumentTheme());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function toggleTheme() {
    const next: ThemeChoice = getDocumentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    close();
  }

  async function copyProfileUrl() {
    setCopyError(false);
    const url = `${window.location.origin}/p/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2800);
    }
    close();
  }

  async function onSignOut() {
    close();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      window.location.href = "/";
      return;
    }
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function downloadExport(format: "json" | "csv" | "pdf") {
    if ((format === "pdf" || format === "csv") && plan === "free") {
      close();
      setUpgradeOpen(true);
      return;
    }
    close();
    setExportLoading(true);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        window.alert(d.error ?? "Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heroportfolio.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Export failed. Check your connection.");
    } finally {
      setExportLoading(false);
    }
  }

  const isDark = theme === "dark";

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label="Account menu"
          onClick={() => setOpen((o) => !o)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dusk-600 bg-dusk-850/90 text-parchment-muted shadow-sm transition hover:border-umber-400/55 hover:bg-dusk-800 hover:text-umber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber-400/70"
          title="Account menu"
        >
          <UserAvatarIcon className="size-[22px] text-umber-300/95" />
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] w-max max-w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-dusk-600/90 bg-dusk-900/95 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            {/* Name + plan badge */}
            <div className="border-b border-dusk-700/80 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <p className="max-w-[min(13rem,calc(100vw-2rem))] truncate text-sm font-medium text-parchment">
                  Hi, {displayName}
                </p>
                {plan === "pro" && (
                  <span className="rounded-full bg-umber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-umber-200">
                    Pro
                  </span>
                )}
              </div>
            </div>

            {/* Export section */}
            <div className="border-b border-dusk-700/60 px-3 py-2.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-parchment-muted/60">
                Export portfolio
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void downloadExport("json")}
                  disabled={exportLoading}
                  className="rounded-full border border-dusk-600 bg-dusk-850 px-2.5 py-1 text-xs font-medium text-parchment-muted transition hover:text-parchment disabled:opacity-50"
                >
                  JSON
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void downloadExport("csv")}
                  disabled={exportLoading}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                    plan === "pro"
                      ? "border-dusk-600 bg-dusk-850 text-parchment-muted hover:text-parchment"
                      : "border-umber-500/35 bg-umber-500/10 text-umber-300 hover:bg-umber-500/18"
                  }`}
                >
                  CSV
                  {plan === "free" && (
                    <span className="rounded-full bg-umber-500/25 px-1 text-[9px] font-bold uppercase tracking-wide text-umber-200">
                      Pro
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void downloadExport("pdf")}
                  disabled={exportLoading}
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                    plan === "pro"
                      ? "border-dusk-600 bg-dusk-850 text-parchment-muted hover:text-parchment"
                      : "border-umber-500/35 bg-umber-500/10 text-umber-300 hover:bg-umber-500/18"
                  }`}
                >
                  PDF Book
                  {plan === "free" && (
                    <span className="rounded-full bg-umber-500/25 px-1 text-[9px] font-bold uppercase tracking-wide text-umber-200">
                      Pro
                    </span>
                  )}
                </button>
              </div>
              {exportLoading && (
                <p className="mt-1.5 text-[11px] text-parchment-muted/60">Preparing export…</p>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={toggleTheme}
                className="flex w-max max-w-full items-center gap-2.5 whitespace-nowrap px-3 py-2.5 text-left text-sm text-parchment transition hover:bg-dusk-850/90"
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              >
                {!themeMounted ? (
                  <SunIcon className="size-4 shrink-0 text-umber-300" />
                ) : isDark ? (
                  <SunIcon className="size-4 shrink-0 text-umber-300" />
                ) : (
                  <MoonIcon className="size-4 shrink-0 text-parchment-muted" />
                )}
                <span>
                  {!themeMounted ? "Theme" : isDark ? "Light mode" : "Dark mode"}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void copyProfileUrl()}
                className="flex w-max max-w-full items-center gap-2.5 whitespace-nowrap px-3 py-2.5 text-left text-sm text-parchment transition hover:bg-dusk-850/90"
              >
                <LinkShareIcon className="size-4 shrink-0 text-umber-300" />
                <span>
                  {copied ? "Copied!" : copyError ? "Copy failed" : "Copy share link"}
                </span>
              </button>
              <div className="border-t border-dusk-700/60 mt-1 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  onClick={() => void onSignOut()}
                  className="flex w-max max-w-full items-center gap-2.5 whitespace-nowrap px-3 py-2.5 text-left text-sm text-parchment-muted transition hover:bg-dusk-850/90 hover:text-parchment disabled:opacity-50"
                >
                  <SignOutIcon className="size-4 shrink-0 text-umber-300/80" />
                  <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Upgrade modal when free user clicks a Pro export */}
      {upgradeOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-dusk-950/80 backdrop-blur-sm"
            onClick={() => setUpgradeOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-umber-500/40 bg-gradient-to-b from-dusk-900 to-dusk-950 p-8 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-umber-500/20 text-xl">
              ⭐
            </div>
            <h2 className="text-lg font-semibold text-parchment">
              PDF &amp; CSV export is a Pro feature
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-parchment-muted">
              Upgrade to Pro to export your portfolio as a beautiful PDF Achievement Book or a CSV spreadsheet. Perfect for college applications.
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
                onClick={() => setUpgradeOpen(false)}
                className="w-full rounded-full border border-dusk-600 py-2.5 text-sm font-medium text-parchment-muted hover:text-parchment"
              >
                Maybe later
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] text-parchment-muted/70">
              Basic stays free forever · JSON export is always free
            </p>
          </div>
        </div>
      )}
    </>
  );
}
