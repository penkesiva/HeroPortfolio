"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PortfolioContentEditor } from "@/components/PortfolioContentEditor";
import { TypewriterName } from "@/components/TypewriterName";
import {
  clearDraftProfileIntro,
  introFromDraftFields,
  loadDraftProfileIntro,
  saveDraftProfileIntro,
  serverIntroToDraftFields,
} from "@/lib/draftProfileIntro";
import {
  clearDraftTimeline,
  loadDraftTimeline,
  saveDraftTimeline,
} from "@/lib/draftTimeline";
import { saveTimelineAction, saveProfileAction } from "@/app/actions/portfolio";
import { AchievementBadges } from "@/components/AchievementBadges";
import { TimelineEmptyState } from "@/components/TimelineEmptyState";
import {
  musicUrlToEmbedSrc,
  videoUrlToEmbedSrc,
  withVideoAutoplay,
} from "@/lib/embedUrls";
import type { Achievement, SiteIntro, YearBlock } from "@/data/timeline";
import type { DraftProfileFields } from "@/lib/draftProfileIntro";

function categorySlugsForAchievement(a: Achievement): string[] {
  return a.categories ?? [];
}

function achievementMatchesCategory(a: Achievement, slug: string): boolean {
  return categorySlugsForAchievement(a).includes(slug);
}

function humanizeCategorySlug(slug: string): string {
  if (slug.toLowerCase() === "stem") return "STEM";
  return slug
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((w) =>
      w.toLowerCase() === "stem"
        ? "STEM"
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

function collectCategorySlugs(timeline: YearBlock[]): string[] {
  const set = new Set<string>();
  for (const block of timeline) {
    for (const a of block.achievements) {
      for (const c of categorySlugsForAchievement(a)) {
        set.add(c);
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Flatten achievements, optionally only those matching a category slug. */
function collectAchievements(
  blocks: YearBlock[],
  categorySlug: string | null,
): Achievement[] {
  const out: Achievement[] = [];
  for (const b of blocks) {
    for (const a of b.achievements) {
      if (
        categorySlug === null ||
        achievementMatchesCategory(a, categorySlug)
      ) {
        out.push(a);
      }
    }
  }
  return out;
}

const MEDIA_FILTER_KEYS = ["photos", "videos", "audios"] as const;
type MediaFilterKey = (typeof MEDIA_FILTER_KEYS)[number];

function isMediaFilterKey(s: string): s is MediaFilterKey {
  return (MEDIA_FILTER_KEYS as readonly string[]).includes(s);
}

function achievementHasMediaType(
  a: Achievement,
  key: MediaFilterKey,
): boolean {
  switch (key) {
    case "photos":
      return Boolean(
        a.imageSrc?.trim() || (a.images && a.images.length > 0),
      );
    case "videos":
      return Boolean(a.videoUrl?.trim());
    case "audios":
      return Boolean(a.musicUrl?.trim());
    default:
      return false;
  }
}

function countMediaInAchievements(achievements: Achievement[]): {
  photos: number;
  videos: number;
  audios: number;
} {
  let photos = 0;
  let videos = 0;
  let audios = 0;
  for (const a of achievements) {
    if (achievementHasMediaType(a, "photos")) photos += 1;
    if (achievementHasMediaType(a, "videos")) videos += 1;
    if (achievementHasMediaType(a, "audios")) audios += 1;
  }
  return { photos, videos, audios };
}

function mediaFilterPhrase(key: MediaFilterKey): string {
  switch (key) {
    case "photos":
      return "with photos";
    case "videos":
      return "with video";
    case "audios":
      return "with audio";
    default:
      return "";
  }
}

function filterYearBlockCategoryAndMedia(
  block: YearBlock,
  categorySlug: string | null,
  mediaKey: MediaFilterKey | null,
): YearBlock {
  let achievements = block.achievements;
  if (categorySlug) {
    achievements = achievements.filter((a) =>
      achievementMatchesCategory(a, categorySlug),
    );
  }
  if (mediaKey) {
    achievements = achievements.filter((a) =>
      achievementHasMediaType(a, mediaKey),
    );
  }
  return { ...block, achievements };
}

function isDataUrl(src: string): boolean {
  return src.startsWith("data:");
}

function MediaImage({
  src,
  alt,
  className,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (isDataUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 size-full object-cover ${className ?? ""}`}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}

const heroContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.06 },
  },
};

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOutExpo },
  },
};

function yearSectionId(year: number) {
  return `year-${year}`;
}

function YearButton({
  block,
  active,
  dimmed,
  onSelect,
  index,
  total,
}: {
  block: YearBlock;
  active: boolean;
  dimmed: boolean;
  onSelect: () => void;
  index: number;
  total: number;
}) {
  const isLast = index === total - 1;
  return (
    <div
      className={`relative flex gap-3 transition-opacity duration-300 ${
        dimmed
          ? "opacity-[0.38] hover:opacity-[0.72]"
          : "opacity-100"
      }`}
    >
      <div className="flex w-5 shrink-0 flex-col items-center">
        {!isLast ? (
          <span
            className="pointer-events-none absolute top-6 bottom-[-12px] w-px bg-dusk-600"
            aria-hidden
          />
        ) : null}
        <motion.button
          type="button"
          onClick={onSelect}
          aria-current={active ? "true" : undefined}
          className="relative z-10 flex size-10 items-center justify-center rounded-full border border-dusk-600 bg-dusk-850 text-sm font-semibold text-parchment-muted outline-none transition-colors hover:border-umber-400/50 hover:text-parchment focus-visible:ring-2 focus-visible:ring-umber-400/60"
          whileTap={{ scale: 0.96 }}
        >
          {active ? (
            <motion.span
              layoutId="year-active"
              className="absolute inset-0 rounded-full border border-umber-400/70 bg-umber-500/15 shadow-[0_0_24px_rgba(184,146,106,0.25)]"
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          ) : null}
          <span className="relative z-10 tabular-nums">
            {String(block.year).slice(2)}
          </span>
        </motion.button>
      </div>
      <div className="min-w-0 flex-1 pb-8">
        <button
          type="button"
          onClick={onSelect}
          className="group w-full text-left"
        >
          <span
            className={`block text-lg font-semibold tracking-tight transition-colors ${
              active
                ? "text-parchment"
                : "text-parchment-muted group-hover:text-parchment"
            }`}
          >
            {block.year}
          </span>
          <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-parchment-muted">
            {block.tagline}
          </span>
        </button>
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  year,
  delay = 0,
  onPlayVideo,
}: {
  achievement: YearBlock["achievements"][number];
  year: number;
  delay?: number;
  onPlayVideo: (watchUrl: string, title: string) => void;
}) {
  const gallery =
    achievement.images && achievement.images.length > 0
      ? achievement.images
      : achievement.imageSrc
        ? [achievement.imageSrc]
        : [];
  const hasImages = gallery.length > 0;
  const prose = achievement.body ?? achievement.description;
  const musicEmbed = achievement.musicUrl
    ? musicUrlToEmbedSrc(achievement.musicUrl)
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: 0.35,
        delay,
        ease: easeOutExpo,
      }}
      className="overflow-hidden rounded-2xl border border-dusk-700/90 bg-dusk-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm"
    >
      {hasImages ? (
        <div className="border-b border-dusk-700/80 bg-dusk-800">
          <div
            className={
              gallery.length > 1
                ? "grid grid-cols-1 gap-px sm:grid-cols-2"
                : "relative aspect-[16/10] w-full overflow-hidden"
            }
          >
            {gallery.length > 1
              ? gallery.map((src, i) => (
                  <div
                    key={`${achievement.id}-img-${i}`}
                    className="relative aspect-[16/10] min-h-[180px] w-full overflow-hidden"
                  >
                  <MediaImage
                    src={src}
                    alt={`${achievement.title} — image ${i + 1}`}
                    className="object-cover opacity-95 transition duration-500 hover:opacity-100"
                    sizes="(max-width: 768px) 100vw, 35vw"
                    priority={false}
                  />
                    {i === 0 ? (
                      <span className="absolute left-3 top-3 rounded-full bg-dusk-950/75 px-2.5 py-1 text-xs font-medium text-parchment-muted backdrop-blur">
                        {year}
                      </span>
                    ) : null}
                  </div>
                ))
              : (
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <MediaImage
                    src={gallery[0]!}
                    alt={achievement.title}
                    className="object-cover opacity-95 transition duration-500 hover:opacity-100"
                    sizes="(max-width: 768px) 100vw, 70vw"
                    priority={false}
                  />
                    <span className="absolute left-3 top-3 rounded-full bg-dusk-950/75 px-2.5 py-1 text-xs font-medium text-parchment-muted backdrop-blur">
                      {year}
                    </span>
                  </div>
                )}
          </div>
        </div>
      ) : null}
      <div className="space-y-2 p-5 sm:space-y-3 sm:p-6">
        {!hasImages ? (
          <span className="inline-block rounded-full bg-dusk-850/90 px-2.5 py-1 text-xs font-medium text-parchment-muted ring-1 ring-dusk-600/80">
            {year}
          </span>
        ) : null}
        <h3 className="text-xl font-semibold tracking-tight text-parchment">
          {achievement.title}
        </h3>
        {achievement.heading2 ? (
          <p className="text-sm font-medium text-umber-300/95">
            {achievement.heading2}
          </p>
        ) : null}
        {achievement.heading3 ? (
          <p className="text-sm text-parchment-muted">{achievement.heading3}</p>
        ) : null}
        {prose ? (
          <p className="text-[15px] leading-relaxed text-parchment-muted">
            {prose}
          </p>
        ) : null}
        {achievement.musicUrl ? (
          musicEmbed ? (
            <div className="overflow-hidden rounded-xl border border-dusk-700/80 bg-black/30">
              <iframe
                title={`${achievement.title} — music`}
                src={musicEmbed}
                className="h-[180px] w-full sm:h-[232px]"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <Link
              href={achievement.musicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-dusk-600 bg-dusk-850 px-4 py-2 text-sm font-medium text-parchment-muted transition hover:border-dusk-600 hover:text-parchment"
            >
              Open music link
            </Link>
          )
        ) : null}
        {achievement.categories && achievement.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {achievement.categories.map((c) => (
              <span
                key={c}
                className="rounded-full border border-dusk-600 bg-dusk-850/80 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-parchment-muted"
              >
                {humanizeCategorySlug(c)}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {achievement.videoUrl ? (
            <button
              type="button"
              onClick={() =>
                onPlayVideo(achievement.videoUrl!, achievement.title)
              }
              className="inline-flex items-center gap-2 rounded-full border border-umber-500/40 bg-umber-500/10 px-4 py-2 text-sm font-medium text-umber-300 transition hover:border-umber-400/60 hover:bg-umber-500/20"
            >
              <PlayIcon className="size-4 shrink-0" />
              Watch video
            </button>
          ) : null}
          {achievement.links?.map((l, li) => (
            <Link
              key={`${li}-${l.href}-${l.label}`}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-dusk-600 bg-dusk-850 px-4 py-2 text-sm font-medium text-parchment-muted transition hover:border-dusk-600 hover:text-parchment"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

type VideoLightboxState = {
  title: string;
  watchUrl: string;
  embedSrc: string | null;
};

function VideoLightbox({
  state,
  onClose,
}: {
  state: VideoLightboxState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, onClose]);

  if (!state) return null;

  const embed = state.embedSrc ? withVideoAutoplay(state.embedSrc) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-dusk-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-lightbox-title"
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-dusk-600/90 bg-dusk-900 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-dusk-700/80 px-4 py-3 sm:px-5">
          <h2
            id="video-lightbox-title"
            className="min-w-0 pr-2 text-sm font-semibold leading-snug text-parchment sm:text-base"
          >
            {state.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-dusk-600 bg-dusk-850 px-2.5 py-1 text-xs font-medium text-parchment-muted transition hover:border-dusk-600 hover:text-parchment"
          >
            Close
          </button>
        </div>
        {embed ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              title={state.title}
              src={embed}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="space-y-4 px-4 py-8 sm:px-6">
            <p className="text-sm text-parchment-muted">
              This link cannot be embedded here. Open it in a new tab instead.
            </p>
            <Link
              href={state.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-umber-500/40 bg-umber-500/10 px-4 py-2 text-sm font-medium text-umber-300 transition hover:border-umber-400/60 hover:bg-umber-500/20"
            >
              <PlayIcon className="size-4 shrink-0" />
              Open video
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

type PortfolioShellProps = {
  timeline: YearBlock[];
  siteIntro: SiteIntro;
  /** Read-only shared view: no local draft, no editor, no saving */
  publicView?: boolean;
  /** Authenticated user id — enables DB saving */
  userId?: string;
  /** Current subscription plan */
  plan?: "free" | "pro";
};

export function PortfolioShell({
  timeline: serverTimeline,
  siteIntro: serverIntro,
  publicView = false,
  userId,
  plan = "free",
}: PortfolioShellProps) {
  const [timeline, setTimeline] = useState(serverTimeline);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [intro, setIntro] = useState(serverIntro);
  const [introDraftHydrated, setIntroDraftHydrated] = useState(false);

  // Track the last successfully saved state so Discard always reverts to the
  // most recent save — not to the stale page-load snapshot.
  const lastSavedTimeline = useRef<YearBlock[]>(serverTimeline);
  const lastSavedIntro = useRef(serverIntro);

  useEffect(() => {
    if (publicView) return;
    const d = loadDraftTimeline();
    startTransition(() => {
      if (d?.length && serverTimeline.length > 0) {
        // Only restore a draft if the server already has real data for this user.
        // If the server is empty, any draft in storage is orphaned (dev leftovers
        // or data from a previous account) — discard it so new users see the
        // correct empty state.
        setTimeline(d);
      } else if (d?.length && serverTimeline.length === 0) {
        clearDraftTimeline();
      }
      setDraftHydrated(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicView]);

  useEffect(() => {
    if (publicView) return;
    const d = loadDraftProfileIntro();
    startTransition(() => {
      if (d) setIntro(introFromDraftFields(serverIntro, d));
      setIntroDraftHydrated(true);
    });
  }, [publicView]);

  useEffect(() => {
    if (!publicView) return;
    startTransition(() => {
      setTimeline(serverTimeline);
      setDraftHydrated(true);
      setIntro(serverIntro);
      setIntroDraftHydrated(true);
    });
  }, [publicView, serverTimeline, serverIntro]);

  useEffect(() => {
    if (publicView) return;
    if (!draftHydrated) return;
    if (loadDraftTimeline()) return;
    startTransition(() => setTimeline(serverTimeline));
  }, [publicView, serverTimeline, draftHydrated]);

  useEffect(() => {
    if (publicView) return;
    if (!introDraftHydrated) return;
    if (loadDraftProfileIntro()) return;
    startTransition(() => setIntro(serverIntro));
  }, [publicView, serverIntro, introDraftHydrated]);

  const applyTimeline = useCallback(
    (next: YearBlock[]) => {
      if (publicView) return;
      setTimeline(next);
      saveDraftTimeline(next);
    },
    [publicView],
  );

  const applyIntro = useCallback(
    (patch: Partial<DraftProfileFields>) => {
      if (publicView) return;
      setIntro((prev) => {
        const fields = serverIntroToDraftFields(prev);
        const next = { ...fields, ...patch };
        saveDraftProfileIntro(next);
        return introFromDraftFields(serverIntro, next);
      });
    },
    [publicView, serverIntro],
  );

  const handleAddYear = useCallback(
    (fromYear: number) => {
      if (publicView) return;
      const currentYear = new Date().getFullYear();
      const yearsToAdd = Array.from(
        { length: Math.max(currentYear - fromYear + 1, 1) },
        (_, i) => fromYear + i,
      );
      let next = [...timeline];
      for (const y of yearsToAdd) {
        if (!next.some((b) => b.year === y)) {
          next = [...next, { year: y, tagline: "", achievements: [] }];
        }
      }
      next = next.sort((a, b) => b.year - a.year);
      applyTimeline(next);
      // Persist scaffolded year blocks to DB immediately so:
      //  1. Page reloads see real server data (not empty) and don't wipe the draft.
      //  2. Discard reverts to this scaffolded state, not to an empty timeline.
      if (userId) {
        lastSavedTimeline.current = next;
        void saveTimelineAction(next).catch(() => {});
      }
      setEditorOpen(true);
    },
    [publicView, timeline, applyTimeline, userId],
  );

  const persistDrafts = useCallback(() => {
    if (publicView) return;
    saveDraftTimeline(timeline);
    saveDraftProfileIntro(serverIntroToDraftFields(intro));
    // Snapshot what we're saving so Discard can revert to it later
    lastSavedTimeline.current = timeline;
    lastSavedIntro.current = intro;
    // Also persist to DB when the user is authenticated
    if (userId) {
      void saveTimelineAction(timeline).catch(() => {});
      void saveProfileAction({
        heroLead: intro.heroLead,
        role: intro.role,
        bio: intro.bio,
        photoSrc: intro.photoSrc,
      }).catch(() => {});
    }
  }, [publicView, timeline, intro, userId]);

  const discardDrafts = useCallback(() => {
    if (publicView) return;
    clearDraftTimeline();
    clearDraftProfileIntro();
    // Revert to the most recent saved state, not to the stale page-load snapshot
    setTimeline(lastSavedTimeline.current);
    setIntro(lastSavedIntro.current);
  }, [publicView]);

  const [editorOpen, setEditorOpen] = useState(false);

  // Always show the editor for the authenticated owner; never for public visitors
  const showContentEditor = !publicView;

  const sorted = useMemo(
    () => [...timeline].sort((a, b) => b.year - a.year),
    [timeline],
  );
  const allCategorySlugs = useMemo(
    () => collectCategorySlugs(sorted),
    [sorted],
  );

  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilterKey | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rawCat = params.get("category");
    if (rawCat) {
      const slug = rawCat.trim().toLowerCase();
      if (allCategorySlugs.includes(slug)) {
        startTransition(() => setCategoryFilter(slug));
      }
    }
    const rawMedia = params.get("media");
    if (rawMedia) {
      const m = rawMedia.trim().toLowerCase();
      if (isMediaFilterKey(m)) {
        startTransition(() => setMediaFilter(m));
      }
    }
  }, [allCategorySlugs]);

  const visibleBlocks = useMemo(() => {
    if (publicView) {
      // Public visitors only see years that have at least one matching achievement
      return sorted
        .map((b) => filterYearBlockCategoryAndMedia(b, categoryFilter, mediaFilter))
        .filter((b) => b.achievements.length > 0);
    }
    // Owners always see all their year blocks so empty ones show a "log first event" card.
    // When filters are active, achievements within each year are filtered but the year
    // itself remains visible so the owner can see which years have no matches.
    if (categoryFilter || mediaFilter) {
      return sorted.map((b) =>
        filterYearBlockCategoryAndMedia(b, categoryFilter, mediaFilter),
      );
    }
    return sorted;
  }, [sorted, categoryFilter, mediaFilter, publicView]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    startTransition(() => {
      if (!visibleBlocks.some((b) => b.year === selectedYear)) {
        const y = visibleBlocks[0]?.year;
        if (y !== undefined) setSelectedYear(y);
      }
    });
  }, [visibleBlocks, selectedYear]);

  const achievementsHeaderContext = useMemo(() => {
    const totalAll = collectAchievements(sorted, null).length;
    const matchingCount = visibleBlocks.reduce(
      (n, b) => n + b.achievements.length,
      0,
    );
    const inCategoryCount = categoryFilter
      ? collectAchievements(sorted, categoryFilter).length
      : totalAll;
    return {
      totalAll,
      matchingCount,
      inCategoryCount,
      categoryLabel: categoryFilter
        ? humanizeCategorySlug(categoryFilter)
        : null,
    };
  }, [sorted, categoryFilter, visibleBlocks]);

  const mediaCountsForCapsules = useMemo(() => {
    return countMediaInAchievements(
      collectAchievements(sorted, categoryFilter),
    );
  }, [sorted, categoryFilter]);

  const setCategoryAndUrl = useCallback(
    (slug: string | null) => {
      setCategoryFilter(slug);
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (slug) url.searchParams.set("category", slug);
      else url.searchParams.delete("category");
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    },
    [],
  );

  const setMediaAndUrl = useCallback((key: MediaFilterKey | null) => {
    setMediaFilter(key);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("media", key);
    else url.searchParams.delete("media");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  const [videoLightbox, setVideoLightbox] =
    useState<VideoLightboxState | null>(null);

  const openVideo = useCallback((watchUrl: string, title: string) => {
    setVideoLightbox({
      title,
      watchUrl,
      embedSrc: videoUrlToEmbedSrc(watchUrl),
    });
  }, []);

  const closeVideo = useCallback(() => setVideoLightbox(null), []);

  const scrollToYear = useCallback((year: number) => {
    const el = document.getElementById(yearSectionId(year));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setSelectedYear(year);
  }, []);

  useEffect(() => {
    if (!visibleBlocks.length) return;
    const elements = visibleBlocks
      .map((b) => document.getElementById(yearSectionId(b.year)))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        const id = top?.target?.id;
        if (id?.startsWith("year-")) {
          const y = Number(id.slice("year-".length));
          if (!Number.isNaN(y)) setSelectedYear(y);
        }
      },
      {
        root: null,
        rootMargin: "-42% 0px -42% 0px",
        threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleBlocks]);

  const photoAlt = intro.photoAlt ?? intro.name;
  const photoIsDataUrl = intro.photoSrc.startsWith("data:");

  return (
    <div className="flex min-h-screen flex-col text-parchment">
      <section
        aria-label="Introduction"
        className="relative flex min-h-[100dvh] flex-col justify-center border-b border-dusk-700/70"
      >
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="order-2 flex flex-col justify-center lg:order-1"
          >
            <motion.p
              variants={heroItem}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400"
            >
              Portfolio
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[2.75rem] lg:leading-tight"
            >
              {intro.heroLead ? (
                <span className="block text-parchment-muted">
                  {intro.heroLead}
                </span>
              ) : null}
              <TypewriterName
                text={intro.name}
                className="block min-h-[1.15em] text-parchment"
              />
            </motion.h1>
            <motion.p
              variants={heroItem}
              className="mt-2 text-sm text-umber-300/90"
            >
              {intro.role}
            </motion.p>
            <motion.p
              variants={heroItem}
              className="mt-5 max-w-xl text-sm leading-relaxed text-parchment-muted sm:text-[15px]"
            >
              {intro.bio}
            </motion.p>
            {timeline.length > 0 && (
              <motion.div variants={heroItem} className="mt-5">
                <AchievementBadges timeline={timeline} />
              </motion.div>
            )}
            <motion.div
              variants={heroItem}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#timeline-start"
                className="inline-flex items-center gap-2 rounded-full border border-umber-500/45 bg-umber-500/10 px-5 py-2.5 text-sm font-medium text-umber-300 transition hover:border-umber-400/65 hover:bg-umber-500/18"
              >
                View timeline
                <span aria-hidden className="text-xs">
                  ↓
                </span>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 flex justify-center lg:order-2 lg:justify-end"
          >
            <div className="relative aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-3xl border border-dusk-700/90 bg-dusk-900/50 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:max-w-[380px]">
              <Image
                src={intro.photoSrc}
                alt={photoAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 72vw, 380px"
                priority
                unoptimized={photoIsDataUrl || intro.photoSrc.endsWith(".svg")}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-dusk-950/50 via-transparent to-transparent" />
              {/* Upload nudge for owner when no real photo is set */}
              {!publicView && intro.photoSrc === "/avatar-placeholder.svg" && (
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  className="absolute inset-0 flex flex-col items-center justify-end gap-1 pb-6 opacity-0 transition-opacity duration-200 hover:opacity-100"
                >
                  <span className="rounded-full bg-dusk-950/80 px-4 py-1.5 text-xs font-medium text-parchment backdrop-blur-sm">
                    Upload photo
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div
        id="timeline-start"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:gap-12 lg:px-8"
      >
        {sorted.length > 0 && (
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-72 lg:shrink-0"
        >
          <div className="lg:sticky lg:top-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-parchment-muted">
              Timeline
            </p>
            <nav
              aria-label="Years"
              className="max-lg:-mx-1 max-lg:flex max-lg:gap-2 max-lg:overflow-x-auto max-lg:pb-2 lg:block"
            >
              <div className="flex gap-2 max-lg:min-w-max lg:hidden">
                {visibleBlocks.map((block) => {
                  const active = selectedYear === block.year;
                  return (
                    <motion.button
                      key={block.year}
                      type="button"
                      onClick={() => scrollToYear(block.year)}
                      whileTap={{ scale: 0.97 }}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border-umber-400/60 bg-umber-500/15 text-parchment opacity-100"
                          : "border-dusk-600 bg-dusk-850 text-parchment-muted opacity-[0.42] hover:opacity-[0.88]"
                      }`}
                    >
                      {block.year}
                    </motion.button>
                  );
                })}
              </div>
              <div className="hidden lg:block">
                {visibleBlocks.map((block, i) => (
                  <YearButton
                    key={block.year}
                    block={block}
                    active={selectedYear === block.year}
                    dimmed={selectedYear !== block.year}
                    onSelect={() => scrollToYear(block.year)}
                    index={i}
                    total={visibleBlocks.length}
                  />
                ))}
              </div>
            </nav>
          </div>
        </motion.aside>
        )}

        <main className="min-w-0 flex-1 pb-16">
          {achievementsHeaderContext.totalAll > 0 && (
          <div className="mb-10 border-b border-dusk-700/70 pb-6 lg:mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
              Achievements
            </p>
            <motion.div
              key={`${categoryFilter ?? "all"}-${mediaFilter ?? "all"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
            >
              <div className="mt-3 max-w-2xl text-sm leading-relaxed text-parchment-muted">
                {achievementsHeaderContext.totalAll === 0 ? (
                  <p>No events recorded across your timeline yet.</p>
                ) : !categoryFilter && !mediaFilter ? (
                  <p>
                    A total of{" "}
                    <span className="font-semibold text-parchment tabular-nums">
                      {achievementsHeaderContext.totalAll}
                    </span>{" "}
                    event
                    {achievementsHeaderContext.totalAll !== 1 ? "s" : ""}{" "}
                    recorded across all years.
                  </p>
                ) : categoryFilter && !mediaFilter ? (
                  achievementsHeaderContext.inCategoryCount === 0 ? (
                    <p>
                      No events in{" "}
                      <span className="font-medium text-umber-300/95">
                        {achievementsHeaderContext.categoryLabel}
                      </span>{" "}
                      across your timeline.
                    </p>
                  ) : (
                    <p>
                      Showing{" "}
                      <span className="font-semibold text-parchment tabular-nums">
                        {achievementsHeaderContext.inCategoryCount}
                      </span>{" "}
                      event
                      {achievementsHeaderContext.inCategoryCount !== 1
                        ? "s"
                        : ""}{" "}
                      in{" "}
                      <span className="font-medium text-umber-300/95">
                        {achievementsHeaderContext.categoryLabel}
                      </span>
                      .
                    </p>
                  )
                ) : !categoryFilter && mediaFilter ? (
                  achievementsHeaderContext.matchingCount === 0 ? (
                    <p>
                      No events {mediaFilterPhrase(mediaFilter)} across your
                      timeline.
                    </p>
                  ) : (
                    <p>
                      Showing{" "}
                      <span className="font-semibold text-parchment tabular-nums">
                        {achievementsHeaderContext.matchingCount}
                      </span>{" "}
                      event
                      {achievementsHeaderContext.matchingCount !== 1
                        ? "s"
                        : ""}{" "}
                      {mediaFilterPhrase(mediaFilter)} across all years.
                    </p>
                  )
                ) : achievementsHeaderContext.matchingCount === 0 ? (
                  <p>
                    No events in{" "}
                    <span className="font-medium text-umber-300/95">
                      {achievementsHeaderContext.categoryLabel}
                    </span>{" "}
                    {mediaFilterPhrase(mediaFilter!)}.
                  </p>
                ) : (
                  <p>
                    Showing{" "}
                    <span className="font-semibold text-parchment tabular-nums">
                      {achievementsHeaderContext.matchingCount}
                    </span>{" "}
                    event
                    {achievementsHeaderContext.matchingCount !== 1 ? "s" : ""}{" "}
                    in{" "}
                    <span className="font-medium text-umber-300/95">
                      {achievementsHeaderContext.categoryLabel}
                    </span>{" "}
                    {mediaFilterPhrase(mediaFilter!)}.
                  </p>
                )}
              </div>
            </motion.div>

            {allCategorySlugs.length > 0 ? (
              <div
                className="mt-6 flex flex-col gap-2 pb-2"
                role="group"
                aria-label="Filter by category"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-parchment-muted">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryAndUrl(null)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      categoryFilter === null
                        ? "border-umber-400/60 bg-umber-500/15 text-parchment"
                        : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-600 hover:text-parchment"
                    }`}
                  >
                    All
                  </button>
                  {allCategorySlugs.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setCategoryAndUrl(slug)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                        categoryFilter === slug
                          ? "border-umber-400/60 bg-umber-500/15 text-parchment"
                          : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-600 hover:text-parchment"
                      }`}
                    >
                      {humanizeCategorySlug(slug)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {achievementsHeaderContext.totalAll > 0 ? (
              <div
                className="mt-6 flex flex-col gap-2 pb-2"
                role="group"
                aria-label="Filter by media type"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-parchment-muted">
                  Media
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaAndUrl(null)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      mediaFilter === null
                        ? "border-umber-400/60 bg-umber-500/15 text-parchment"
                        : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-600 hover:text-parchment"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaAndUrl("photos")}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      mediaFilter === "photos"
                        ? "border-umber-400/60 bg-umber-500/15 text-parchment"
                        : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-600 hover:text-parchment"
                    }`}
                  >
                    Photos{" "}
                    <span className="tabular-nums opacity-80">
                      {mediaCountsForCapsules.photos}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaAndUrl("videos")}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      mediaFilter === "videos"
                        ? "border-umber-400/60 bg-umber-500/15 text-parchment"
                        : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-600 hover:text-parchment"
                    }`}
                  >
                    Videos{" "}
                    <span className="tabular-nums opacity-80">
                      {mediaCountsForCapsules.videos}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaAndUrl("audios")}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      mediaFilter === "audios"
                        ? "border-umber-400/60 bg-umber-500/15 text-parchment"
                        : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-600 hover:text-parchment"
                    }`}
                  >
                    Audios{" "}
                    <span className="tabular-nums opacity-80">
                      {mediaCountsForCapsules.audios}
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          )}

          <div className="flex flex-col gap-20 lg:gap-24">
            {sorted.length === 0 && !publicView ? (
              <TimelineEmptyState
                onAddYear={handleAddYear}
                onOpenEditor={() => setEditorOpen(true)}
              />
            ) : null}
            {(categoryFilter || mediaFilter) &&
            achievementsHeaderContext.totalAll > 0 &&
            visibleBlocks.every((b) => b.achievements.length === 0) ? (
              <p className="rounded-2xl border border-dusk-700/80 bg-dusk-900/40 px-5 py-8 text-center text-sm text-parchment-muted">
                No achievements match these filters.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryAndUrl(null);
                    setMediaAndUrl(null);
                  }}
                  className="font-medium text-umber-300 underline decoration-umber-500/50 underline-offset-2 hover:text-umber-200"
                >
                  Clear filters
                </button>
              </p>
            ) : null}
            {visibleBlocks.map((block) => {
              // Determine if the year truly has no events vs. events hidden by a filter
              const originalBlock = sorted.find((b) => b.year === block.year);
              const yearHasAnyEvents = (originalBlock?.achievements.length ?? 0) > 0;
              const isEmptyYear = block.achievements.length === 0;

              return (
              <section
                key={block.year}
                id={yearSectionId(block.year)}
                aria-labelledby={`year-heading-${block.year}`}
                className="scroll-mt-28"
              >
                <div className="mb-6 border-b border-dusk-700/50 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
                    Year
                  </p>
                  <h2
                    id={`year-heading-${block.year}`}
                    className="mt-1 text-2xl font-semibold tabular-nums tracking-tight lg:text-3xl"
                  >
                    {block.year}
                  </h2>
                  {block.tagline ? (
                    <p className="mt-2 max-w-2xl text-sm text-parchment-muted lg:text-[15px]">
                      {block.tagline}
                    </p>
                  ) : null}
                </div>

                {isEmptyYear && !publicView && !yearHasAnyEvents ? (
                  // Empty year — owner sees a "log first event" placeholder
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="group flex w-full flex-col items-center rounded-2xl border border-dashed border-dusk-600/70 bg-dusk-900/30 py-10 text-center transition hover:border-umber-500/50 hover:bg-dusk-900/50"
                  >
                    <DotLottieReact
                      src={
                        block.year % 2 === 0
                          ? "/animations/cat_playing_idle.lottie"
                          : "/animations/loader_cat_idle.lottie"
                      }
                      autoplay
                      loop
                      className="h-32 w-32 opacity-75 transition group-hover:opacity-100"
                    />
                    <span className="mt-4 block text-sm font-medium text-parchment-muted group-hover:text-parchment">
                      Nothing logged for {block.year} yet
                    </span>
                    <span className="mt-1 block text-xs text-parchment-muted/50">
                      Click to open the editor and add your first event.
                    </span>
                  </button>
                ) : isEmptyYear && !publicView && yearHasAnyEvents ? (
                  // Year has events but none match the active filter
                  <p className="text-sm text-parchment-muted/60">
                    No events match the active filter for {block.year}.
                  </p>
                ) : (
                  <div className="mt-6 grid gap-6 sm:gap-8">
                    {block.achievements.map((a, i) => (
                      <AchievementCard
                        key={a.id}
                        achievement={a}
                        year={block.year}
                        delay={0.04 + i * 0.06}
                        onPlayVideo={openVideo}
                      />
                    ))}
                  </div>
                )}
              </section>
              );
            })}
          </div>
        </main>
      </div>

      <VideoLightbox state={videoLightbox} onClose={closeVideo} />

      {showContentEditor ? (
        <>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="fixed bottom-5 right-5 z-[80] rounded-full border border-umber-500/50 bg-umber-500/20 px-4 py-2.5 text-sm font-medium text-umber-200 shadow-lg backdrop-blur transition hover:bg-umber-500/30"
          >
            Edit content
          </button>
          <PortfolioContentEditor
            open={editorOpen}
            onClose={() => setEditorOpen(false)}
            timeline={timeline}
            serverTimeline={serverTimeline}
            onApplyTimeline={applyTimeline}
            intro={intro}
            onApplyIntro={applyIntro}
            onPersistDrafts={persistDrafts}
            onDiscardDrafts={discardDrafts}
            onAddYear={handleAddYear}
            plan={plan}
          />
        </>
      ) : null}

      <footer className="border-t border-dusk-700/70 bg-dusk-900/30 py-6 text-center text-xs text-parchment-muted/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          <span>© {new Date().getFullYear()} OneCreator LLC. All rights reserved.</span>
          <span className="text-dusk-700">·</span>
          <Link href="/" className="hover:text-parchment-muted transition">HeroPortfolio.com</Link>
          <span className="text-dusk-700">·</span>
          <Link href="/pricing" className="hover:text-parchment-muted transition">Pricing</Link>
          {publicView && (
            <>
              <span className="text-dusk-700">·</span>
              <Link
                href="/signup"
                className="font-medium text-umber-300/80 hover:text-umber-200 transition"
              >
                Create your portfolio
              </Link>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
