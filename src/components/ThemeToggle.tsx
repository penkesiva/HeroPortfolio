"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  getDocumentTheme,
  type ThemeChoice,
} from "@/lib/themePreference";

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

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setTheme(getDocumentTheme());
      setMounted(true);
    });
  }, []);

  const toggle = useCallback(() => {
    const next: ThemeChoice = getDocumentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }, []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed right-4 top-4 z-[200] flex size-11 items-center justify-center rounded-full border border-dusk-600/90 bg-dusk-900/85 text-parchment shadow-lg backdrop-blur-md transition hover:border-umber-400/50 hover:bg-dusk-850/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber-400/70"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      suppressHydrationWarning
    >
      {!mounted ? (
        <SunIcon className="size-5 text-umber-300" />
      ) : isDark ? (
        <SunIcon className="size-5 text-umber-300" />
      ) : (
        <MoonIcon className="size-5 text-parchment" />
      )}
    </button>
  );
}
