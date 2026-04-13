/** Only allow same-origin path redirects (blocks open redirects). */
export function sanitizeAuthRedirect(
  next: string | null | undefined,
  fallback: string,
): string {
  if (next == null || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://")) return fallback;
  return t || fallback;
}
