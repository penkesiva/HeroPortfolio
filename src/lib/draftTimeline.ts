import type { YearBlock } from "@/data/timeline";

export const DRAFT_TIMELINE_STORAGE_KEY = "samportfolio-timeline-draft-v1";

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

export function loadDraftTimeline(): YearBlock[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_TIMELINE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isYearBlockArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraftTimeline(timeline: YearBlock[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DRAFT_TIMELINE_STORAGE_KEY,
      JSON.stringify(timeline),
    );
  } catch {
    // QuotaExceededError — draft too large
  }
}

export function clearDraftTimeline(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_TIMELINE_STORAGE_KEY);
}
