/** Public-folder default hero/profile images (see `public/default-avatar-*.png`). */
export const DEFAULT_AVATAR_DARK = "/default-avatar-dark.png";
export const DEFAULT_AVATAR_LIGHT = "/default-avatar-light.png";

/** Legacy sentinel still stored in DB for “no custom photo”. */
export const LEGACY_DEFAULT_AVATAR = "/avatar-placeholder.svg";

const DEFAULT_AVATAR_PATHS = new Set([
  DEFAULT_AVATAR_DARK,
  DEFAULT_AVATAR_LIGHT,
  LEGACY_DEFAULT_AVATAR,
]);

export function isDefaultAvatar(src: string | null | undefined): boolean {
  if (!src || !String(src).trim()) return true;
  return DEFAULT_AVATAR_PATHS.has(String(src).trim());
}

export function defaultAvatarForTheme(theme: "light" | "dark"): string {
  return theme === "light" ? DEFAULT_AVATAR_LIGHT : DEFAULT_AVATAR_DARK;
}

export function resolveAvatarSrc(
  src: string,
  theme: "light" | "dark",
): string {
  if (isDefaultAvatar(src)) return defaultAvatarForTheme(theme);
  return src;
}

/** Stored in DB / drafts when the user has not uploaded a custom photo. */
export const DEFAULT_AVATAR_STORED = LEGACY_DEFAULT_AVATAR;
