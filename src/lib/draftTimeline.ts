import type { YearBlock } from "@/data/timeline";

const DRAFT_TIMELINE_STORAGE_KEY_BASE = "samportfolio-timeline-draft-v1";

function timelineDraftKey(userId?: string) {
  return userId ? `${DRAFT_TIMELINE_STORAGE_KEY_BASE}-${userId}` : DRAFT_TIMELINE_STORAGE_KEY_BASE;
}

/** @deprecated use the userId-scoped version */
export const DRAFT_TIMELINE_STORAGE_KEY = DRAFT_TIMELINE_STORAGE_KEY_BASE;

function isYearBlockArray(x: unknown): x is YearBlock[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every(
    (row) =>
      row &&
      typeof row === "object" &&
      typeof (row as YearBlock).year === "number" &&
      Array.isArray((row as YearBlock).achievements),
  );
}

export function loadDraftTimeline(userId?: string): YearBlock[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(timelineDraftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isYearBlockArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraftTimeline(timeline: YearBlock[], userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(timelineDraftKey(userId), JSON.stringify(timeline));
  } catch {
    // QuotaExceededError — draft too large
  }
}

export function clearDraftTimeline(userId?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(timelineDraftKey(userId));
}
