export const THEME_STORAGE_KEY = "samportfolio-theme";

export type ThemeChoice = "light" | "dark";
export type ThemeSetting = "auto" | "light" | "dark";

/** Returns the theme that matches the current hour (6am-6pm = light, else dark). */
export function getTimeBasedTheme(): ThemeChoice {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "light" : "dark";
}

/**
 * Inline script for layout.tsx: runs before paint to set data-theme.
 * Priority: explicit stored value → time-of-day auto → dark fallback.
 */
export function getThemeInitScript(): string {
  const k = THEME_STORAGE_KEY;
  return `(function(){try{var d=document.documentElement;var s=localStorage.getItem("${k}");if(s==="light"||s==="dark"){d.setAttribute("data-theme",s);return;}var h=new Date().getHours();d.setAttribute("data-theme",(h>=6&&h<18)?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;
}

export function readStoredThemeSetting(): ThemeSetting {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
    return "auto";
  } catch {
    return "auto";
  }
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
  try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* ignore */ }
}

export function clearStoredTheme(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(THEME_STORAGE_KEY); } catch { /* ignore */ }
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

export function applyAutoTheme(): void {
  clearStoredTheme();
  document.documentElement.setAttribute("data-theme", getTimeBasedTheme());
}
