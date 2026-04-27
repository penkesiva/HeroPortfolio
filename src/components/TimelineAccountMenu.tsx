"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  applyTheme,
  applyAutoTheme,
  getDocumentTheme,
  readStoredThemeSetting,
  type ThemeChoice,
  type ThemeSetting,
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

const DEFAULT_AVATAR = "/avatar-placeholder.svg";

type Props = {
  userId: string;
  displayName: string;
  plan?: "free" | "pro";
  /** Hero / profile photo — shown as a small center-crop circle, same source as the hero image. */
  avatarSrc?: string | null;
  avatarAlt?: string;
};

function shouldShowProfileAvatar(avatarSrc: string | null | undefined): boolean {
  if (!avatarSrc || !String(avatarSrc).trim()) return false;
  return String(avatarSrc).trim() !== DEFAULT_AVATAR;
}

export function TimelineAccountMenu({
  userId,
  displayName,
  plan = "free",
  avatarSrc = null,
  avatarAlt,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>("dark");
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>("auto");
  const [themeMounted, setThemeMounted] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const router = useRouter();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    startTransition(() => {
      setTheme(getDocumentTheme());
      setThemeSetting(readStoredThemeSetting());
      setThemeMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setTheme(getDocumentTheme());
    setThemeSetting(readStoredThemeSetting());
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

  function setThemeOption(setting: ThemeSetting) {
    if (setting === "auto") {
      applyAutoTheme();
      setThemeSetting("auto");
      setTheme(getDocumentTheme());
    } else {
      applyTheme(setting);
      setThemeSetting(setting);
      setTheme(setting);
    }
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
      router.push("/pricing");
      return;
    }
    close();
    setExportLoading(true);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) {
        let message = "Export failed.";
        const ct = res.headers.get("content-type") ?? "";
        try {
          if (ct.includes("application/json")) {
            const d = (await res.json()) as { error?: string };
            message = d.error ?? message;
          } else {
            const t = await res.text();
            if (t) message = t.slice(0, 200);
          }
        } catch {
          /* keep default */
        }
        window.alert(message);
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

  void theme; // used indirectly via themeSetting

  const usePhotoAvatar = shouldShowProfileAvatar(avatarSrc);

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
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border border-dusk-600 bg-dusk-850/90 text-parchment-muted shadow-sm transition hover:border-umber-400/55 hover:bg-dusk-800 hover:text-umber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber-400/70 ${
            usePhotoAvatar ? "overflow-hidden p-0" : ""
          }`}
          title="Account menu"
        >
          {usePhotoAvatar && avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URLs and signed URLs; matches hero
            <img
              src={avatarSrc}
              alt={avatarAlt || displayName}
              className="size-full min-h-0 min-w-0 object-cover object-center"
            />
          ) : (
            <UserAvatarIcon className="size-[22px] text-umber-300/95" />
          )}
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label="Account"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] w-max max-w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-dusk-600/90 bg-dusk-900/95 py-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
          >
            {/* Name + plan (one row when it fits; pill wraps to next line, right-aligned) */}
            <div className="border-b border-dusk-700/80 px-3 py-2.5">
              <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                <p className="min-w-0 flex-1 text-sm font-medium text-parchment">
                  <span
                    className="block min-w-0 truncate"
                    title={`Hi, ${displayName}`}
                  >
                    Hi, {displayName}
                  </span>
                </p>
                {plan === "pro" ? (
                  <span className="ml-auto inline-flex shrink-0 rounded-full border border-umber-500/40 bg-umber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-umber-200">
                    Pro
                  </span>
                ) : (
                  <span className="ml-auto inline-flex shrink-0 rounded-full border border-dusk-600 bg-dusk-850/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-parchment-muted">
                    Basic plan
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
                    <span className="rounded-full bg-umber-500 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
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
                    <span className="rounded-full bg-umber-500 px-1.5 text-[9px] font-bold uppercase tracking-wide text-white">
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
              {/* Theme: capsule track + pill segments (matches export row style) */}
              <div className="px-3 py-2.5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-parchment-muted/60">
                  Theme
                </p>
                <div className="flex h-9 w-full min-w-0 items-stretch gap-0 overflow-hidden rounded-full border border-dusk-600 bg-dusk-850/90 p-0 shadow-sm">
                  {(["auto", "light", "dark"] as ThemeSetting[]).map((opt) => {
                    const isActive = themeMounted && themeSetting === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        role="menuitem"
                        onClick={() => setThemeOption(opt)}
                        className={`box-border flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-medium leading-tight transition sm:gap-1.5 sm:px-2 sm:text-xs ${
                          isActive
                            ? "z-[1] border border-dusk-500/80 bg-dusk-700 text-parchment shadow-sm"
                            : "border border-transparent text-parchment-muted hover:bg-dusk-800/80 hover:text-parchment"
                        }`}
                      >
                        {opt === "auto" && (
                          <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="currentColor" aria-hidden>
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM2 8a6 6 0 0 1 6-6v12A6 6 0 0 1 2 8Z" />
                          </svg>
                        )}
                        {opt === "light" && <SunIcon className="size-3.5 shrink-0" />}
                        {opt === "dark"  && <MoonIcon className="size-3.5 shrink-0" />}
                        <span className="truncate capitalize">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {themeMounted && themeSetting === "auto" && (
                  <p className="mt-1.5 text-[10px] text-parchment-muted/50">
                    Follows time of day · light 6am–6pm
                  </p>
                )}
              </div>
              <div className="px-3 pb-2.5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-parchment-muted/60">
                  Share
                </p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void copyProfileUrl()}
                  className={`flex w-full items-center justify-center gap-2 rounded-full border px-2.5 py-2 text-xs font-medium transition ${
                    copied
                      ? "border-umber-500/40 bg-umber-500/15 text-umber-200 shadow-sm ring-1 ring-umber-500/20"
                      : copyError
                        ? "border-red-500/35 bg-red-500/10 text-red-300/95 hover:border-red-500/45"
                        : "border-dusk-600 bg-dusk-850 text-parchment-muted shadow-sm hover:border-umber-500/35 hover:bg-dusk-800 hover:text-parchment"
                  }`}
                >
                  <LinkShareIcon
                    className={`size-3.5 shrink-0 ${
                      copied ? "text-umber-200" : copyError ? "text-red-300/90" : "text-umber-300"
                    }`}
                  />
                  <span>
                    {copied ? "Copied!" : copyError ? "Copy failed" : "Copy share link"}
                  </span>
                </button>
              </div>
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
    </>
  );
}
