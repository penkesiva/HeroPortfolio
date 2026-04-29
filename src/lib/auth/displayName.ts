import type { User } from "@supabase/supabase-js";

/** Best-effort display name from Supabase user (OAuth metadata, then email local-part). */
export function displayNameFromUser(user: User): string {
  const m = user.user_metadata as Record<string, unknown>;
  const pick = (k: string) => {
    const v = m[k];
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };
  const fromParts = () => {
    const a = pick("first_name");
    const b = pick("last_name");
    const combined = `${a} ${b}`.trim();
    return combined || "";
  };

  return (
    pick("full_name") ||
    fromParts() ||
    pick("name") ||
    pick("display_name") ||
    pick("preferred_username") ||
    (user.email?.split("@")[0] ?? "").trim() ||
    "Student"
  );
}
