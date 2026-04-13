import fs from "node:fs";
import path from "node:path";
import type { SiteIntro } from "@/data/timeline";

const PROFILE_PATH = path.join(
  process.cwd(),
  "public",
  "content",
  "profile.json",
);

export type ProfileIntroJson = Partial<
  Pick<SiteIntro, "photoSrc" | "role" | "bio" | "heroLead">
>;

/** Optional `public/content/profile.json` — edit hero photo and copy without changing TypeScript. */
export function loadProfileIntroOverrides(): ProfileIntroJson {
  if (!fs.existsSync(PROFILE_PATH)) return {};
  try {
    const raw = fs.readFileSync(PROFILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const o = parsed as Record<string, unknown>;
    const out: ProfileIntroJson = {};
    if (typeof o.photoSrc === "string" && o.photoSrc.trim()) {
      out.photoSrc = o.photoSrc.trim();
    }
    if (typeof o.role === "string") out.role = o.role;
    if (typeof o.bio === "string") out.bio = o.bio;
    if (typeof o.heroLead === "string") {
      const t = o.heroLead.trim();
      out.heroLead = t === "" ? undefined : t;
    }
    return out;
  } catch {
    return {};
  }
}
