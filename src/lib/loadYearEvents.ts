import fs from "node:fs";
import path from "node:path";
import type { Achievement, YearBlock } from "@/data/timeline";

export type ContentEventJson = {
  id: string;
  heading1: string;
  heading2?: string;
  heading3?: string;
  body?: string;
  images?: string[];
  /** Single category slug; merged with `categories`. */
  category?: string;
  /** Multiple slugs, e.g. `["music", "leadership"]`. */
  categories?: string[];
  videoUrl?: string;
  musicUrl?: string;
  links?: { label: string; href: string }[];
};

export type YearEventsFileJson = {
  tagline?: string;
  events: ContentEventJson[];
};

function normalizeCategoryList(
  category?: string,
  categories?: string[],
): string[] | undefined {
  const raw = [
    ...(typeof category === "string" ? [category] : []),
    ...(Array.isArray(categories) ? categories : []),
  ];
  const slugs = raw
    .map((s) => String(s).trim().toLowerCase())
    .filter((s) => s.length > 0);
  if (!slugs.length) return undefined;
  return [...new Set(slugs)];
}

function mapEventToAchievement(event: ContentEventJson): Achievement {
  const imgs = Array.isArray(event.images)
    ? event.images.filter((s): s is string => typeof s === "string" && s.length > 0)
    : [];
  const categories = normalizeCategoryList(event.category, event.categories);
  const hasImages = imgs.length > 0;
  return {
    id: String(event.id),
    title: String(event.heading1),
    heading2: event.heading2,
    heading3: event.heading3,
    body: event.body,
    description: event.body ?? "",
    ...(hasImages
      ? {
          imageSrc: imgs[0],
          images: imgs.length > 1 ? imgs : undefined,
        }
      : {}),
    videoUrl: event.videoUrl,
    musicUrl: event.musicUrl,
    links: event.links,
    categories,
  };
}

function readYearEventsFile(year: number): YearEventsFileJson | null {
  const file = path.join(
    process.cwd(),
    "public",
    "content",
    String(year),
    "events.json",
  );
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    if (!Array.isArray(obj.events)) return null;
    return parsed as YearEventsFileJson;
  } catch {
    return null;
  }
}

/** Merge `public/content/<year>/events.json` into timeline rows when the file exists. */
export function mergeTimelineWithPublicContent(
  baseTimeline: YearBlock[],
): YearBlock[] {
  return baseTimeline.map((block) => {
    const file = readYearEventsFile(block.year);
    if (!file || !Array.isArray(file.events) || file.events.length === 0) {
      return block;
    }
    const achievements = file.events.map(mapEventToAchievement);
    const tagline =
      typeof file.tagline === "string" && file.tagline.trim().length > 0
        ? file.tagline.trim()
        : block.tagline;
    return { ...block, tagline, achievements };
  });
}
