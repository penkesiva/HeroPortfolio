export const THEME_STORAGE_KEY = "samportfolio-theme";

export type ThemeChoice = "light" | "dark";

/** Inline script for layout: set `data-theme` on `<html>` before paint. */
export function getThemeInitScript(): string {
  const k = THEME_STORAGE_KEY;
  return `(function(){try{var d=document.documentElement;var s=localStorage.getItem("${k}");if(s==="light"||s==="dark"){d.setAttribute("data-theme",s);return;}if(window.matchMedia("(prefers-color-scheme: light)").matches){d.setAttribute("data-theme","light");}else{d.setAttribute("data-theme","dark");}}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
}

export function readStoredTheme(): ThemeChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: ThemeChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function getDocumentTheme(): ThemeChoice {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" ? "light" : "dark";
}

export function applyTheme(theme: ThemeChoice): void {
  document.documentElement.setAttribute("data-theme", theme);
  writeStoredTheme(theme);
}
