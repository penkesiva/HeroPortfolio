import type { Achievement, SiteIntro, YearBlock } from "@/data/timeline";
import { getLimit } from "@/lib/planGate";
import type { Plan } from "@/types/database";

export type PortfolioImportEventJson = {
  id?: string;
  heading1?: string;
  title?: string;
  heading2?: string;
  body?: string;
  description?: string;
  category?: string;
  categories?: string[];
  images?: string[];
  imageSrc?: string;
  videoUrl?: string;
  musicUrl?: string;
  links?: { label: string; href: string }[];
  amountRaised?: number;
};

export type PortfolioImportYearJson = {
  year: number;
  tagline?: string;
  events?: PortfolioImportEventJson[];
};

export type PortfolioImportProfileJson = {
  name?: string;
  heroLead?: string;
  role?: string;
  bio?: string;
  photoSrc?: string;
};

/** HeroPortfolio export + hand-authored sample files. */
export type PortfolioImportFileJson = {
  version?: number;
  exportedAt?: string;
  /** Optional — documents which login owns this sample (not used during import). */
  portfolioUserId?: string;
  name?: string;
  profile?: PortfolioImportProfileJson;
  years?: PortfolioImportYearJson[];
  /** Legacy single-year file (`public/content/<year>/events.json`). */
  tagline?: string;
  events?: PortfolioImportEventJson[];
  year?: number;
};

export type ParsedPortfolioImport = {
  timeline: YearBlock[];
  profile: Partial<Pick<SiteIntro, "name" | "heroLead" | "role" | "bio" | "photoSrc">> | null;
  warnings: string[];
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function resolveEventId(
  raw: string | undefined,
  warnings: string[],
  label: string,
): string {
  if (typeof raw === "string" && raw.trim()) {
    const id = raw.trim();
    if (isUuid(id)) return id;
    warnings.push(`${label}: replaced non-UUID id "${id}" with a new UUID.`);
  }
  return crypto.randomUUID();
}

function mapEventToAchievement(
  event: PortfolioImportEventJson,
  year: number,
  index: number,
  warnings: string[],
): Achievement {
  const title = String(event.heading1 ?? event.title ?? "").trim();
  if (!title) {
    throw new Error(`Event ${index + 1} in year ${year} is missing a title (heading1).`);
  }

  const imgs = Array.isArray(event.images)
    ? event.images.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];
  if (typeof event.imageSrc === "string" && event.imageSrc.trim()) {
    imgs.unshift(event.imageSrc.trim());
  }
  const uniqueImages = [...new Set(imgs)];
  const body = event.body ?? event.description ?? "";
  const categories = normalizeCategoryList(event.category, event.categories);

  return {
    id: resolveEventId(
      event.id,
      warnings,
      `"${title}" (${year})`,
    ),
    title,
    heading2: event.heading2,
    body: body || undefined,
    description: body,
    ...(uniqueImages.length > 0
      ? {
          imageSrc: uniqueImages[0],
          images: uniqueImages.length > 1 ? uniqueImages : undefined,
        }
      : {}),
    videoUrl: event.videoUrl,
    musicUrl: event.musicUrl,
    links: event.links,
    categories,
    amountRaised: event.amountRaised,
  };
}

function parseYearBlocks(data: PortfolioImportFileJson, warnings: string[]): YearBlock[] {
  if (Array.isArray(data.years) && data.years.length > 0) {
    return data.years
      .map((block) => {
        const year = Number(block.year);
        if (!Number.isFinite(year)) {
          throw new Error("Each year block needs a numeric year.");
        }
        const events = Array.isArray(block.events) ? block.events : [];
        return {
          year,
          tagline: typeof block.tagline === "string" ? block.tagline.trim() : "",
          achievements: events.map((ev, i) =>
            mapEventToAchievement(ev, year, i, warnings),
          ),
        };
      })
      .sort((a, b) => b.year - a.year);
  }

  if (Array.isArray(data.events)) {
    const year = Number(data.year ?? new Date().getFullYear());
    if (!Number.isFinite(year)) {
      throw new Error("Single-year import files need a numeric year.");
    }
    return [
      {
        year,
        tagline: typeof data.tagline === "string" ? data.tagline.trim() : "",
        achievements: data.events.map((ev, i) =>
          mapEventToAchievement(ev, year, i, warnings),
        ),
      },
    ];
  }

  throw new Error(
    'JSON must include a "years" array (export format) or an "events" array (single-year format).',
  );
}

function parseProfile(data: PortfolioImportFileJson): ParsedPortfolioImport["profile"] {
  const profile = data.profile ?? {};
  const name = profile.name ?? data.name;
  const patch: NonNullable<ParsedPortfolioImport["profile"]> = {};

  if (typeof name === "string" && name.trim()) patch.name = name.trim();
  if (typeof profile.heroLead === "string" && profile.heroLead.trim()) {
    patch.heroLead = profile.heroLead.trim();
  }
  if (typeof profile.role === "string" && profile.role.trim()) {
    patch.role = profile.role.trim();
  }
  if (typeof profile.bio === "string" && profile.bio.trim()) {
    patch.bio = profile.bio.trim();
  }
  if (typeof profile.photoSrc === "string" && profile.photoSrc.trim()) {
    patch.photoSrc = profile.photoSrc.trim();
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function parsePortfolioImportJson(raw: string): ParsedPortfolioImport {
  let data: PortfolioImportFileJson;
  try {
    data = JSON.parse(raw) as PortfolioImportFileJson;
  } catch {
    throw new Error("File is not valid JSON.");
  }

  if (!data || typeof data !== "object") {
    throw new Error("JSON root must be an object.");
  }

  const warnings: string[] = [];

  if (
    typeof data.portfolioUserId === "string" &&
    data.portfolioUserId.trim() &&
    !isUuid(data.portfolioUserId)
  ) {
    warnings.push(
      `portfolioUserId "${data.portfolioUserId.trim()}" is not a UUID — ignored.`,
    );
  }

  const timeline = parseYearBlocks(data, warnings);
  if (timeline.length === 0) {
    throw new Error("Import file has no years or events.");
  }

  return {
    timeline,
    profile: parseProfile(data),
    warnings,
  };
}

/** Trim imported data to fit the active plan (free tier caps). */
export function clampTimelineToPlan(
  timeline: YearBlock[],
  plan: Plan,
): { timeline: YearBlock[]; warnings: string[] } {
  const eventsLimit = getLimit(plan, "eventsPerYear");
  const imagesLimit = getLimit(plan, "imagesPerEvent");
  const warnings: string[] = [];

  if (!Number.isFinite(eventsLimit) && !Number.isFinite(imagesLimit)) {
    return { timeline, warnings };
  }

  const next = timeline.map((block) => {
    let achievements = block.achievements;
    if (Number.isFinite(eventsLimit) && achievements.length > eventsLimit) {
      warnings.push(
        `${block.year}: kept ${eventsLimit} of ${achievements.length} events (plan limit).`,
      );
      achievements = achievements.slice(0, eventsLimit);
    }

    achievements = achievements.map((a) => {
      const sources = [
        ...(a.imageSrc ? [a.imageSrc] : []),
        ...(a.images ?? []),
      ];
      const unique = [...new Set(sources)];
      if (Number.isFinite(imagesLimit) && unique.length > imagesLimit) {
        warnings.push(
          `"${a.title}" (${block.year}): kept ${imagesLimit} of ${unique.length} photos (plan limit).`,
        );
        const kept = unique.slice(0, imagesLimit);
        return {
          ...a,
          imageSrc: kept[0],
          images: kept.length > 1 ? kept : undefined,
        };
      }
      return a;
    });

    return { ...block, achievements };
  });

  return { timeline: next, warnings };
}
