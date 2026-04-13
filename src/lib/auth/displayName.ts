import type { User } from "@supabase/supabase-js";

/** Best-effort display name from Supabase user (OAuth metadata, then email local-part). */
export function displayNameFromUser(user: User): string {
  const m = user.user_metadata as Record<string, unknown>;
  const pick = (k: string) => {
    const v = m[k];
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };
  return (
    pick("full_name") ||
    pick("name") ||
    pick("display_name") ||
    pick("preferred_username") ||
    (user.email?.split("@")[0] ?? "").trim() ||
    "Student"
  );
}
