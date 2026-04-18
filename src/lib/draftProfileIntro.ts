import type { SiteIntro } from "@/data/timeline";

export const DRAFT_PROFILE_STORAGE_KEY = "samportfolio-profile-draft-v1";

/** Stored hero fields; empty `heroLead` means hide the lead line. */
export type DraftProfileFields = {
  heroLead: string;
  role: string;
  bio: string;
  photoSrc: string;
  name: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === "object";
}

function isFullDraft(x: unknown): x is DraftProfileFields {
  if (!isRecord(x)) return false;
  return (
    typeof x.heroLead === "string" &&
    typeof x.role === "string" &&
    typeof x.bio === "string" &&
    typeof x.photoSrc === "string"
  );
}

export function loadDraftProfileIntro(): DraftProfileFields | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isFullDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraftProfileIntro(fields: DraftProfileFields): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DRAFT_PROFILE_STORAGE_KEY,
      JSON.stringify(fields),
    );
  } catch {
    // QuotaExceededError
  }
}

export function clearDraftProfileIntro(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_PROFILE_STORAGE_KEY);
}

export function introFromDraftFields(
  server: SiteIntro,
  draft: DraftProfileFields,
): SiteIntro {
  return {
    ...server,
    // Preserve raw value in state (keeps spaces while typing); only treat
    // all-whitespace as "empty / hidden". Trim happens at display/save time.
    heroLead: draft.heroLead.trim() === "" ? undefined : draft.heroLead,
    role: draft.role,
    bio: draft.bio,
    photoSrc: draft.photoSrc,
    name: draft.name || server.name,
  };
}

export function serverIntroToDraftFields(server: SiteIntro): DraftProfileFields {
  return {
    heroLead: server.heroLead ?? "",
    role: server.role,
    bio: server.bio,
    photoSrc: server.photoSrc,
    name: server.name,
  };
}
