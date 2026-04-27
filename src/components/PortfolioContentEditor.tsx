"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { Achievement, SiteIntro, YearBlock } from "@/data/timeline";
import type { DraftProfileFields } from "@/lib/draftProfileIntro";
import { FREE_AI_LABEL } from "@/lib/constants";
import { UpgradeModal } from "@/components/UpgradeModal";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  BUCKET_EVENT_IMAGES,
  MAX_EVENT_AUDIO_BYTES,
  deleteEventImage,
  uploadEventAudio,
} from "@/lib/storage";
import { isDirectPlayableAudioUrl, musicUrlToEmbedSrc } from "@/lib/embedUrls";
import { canAccess } from "@/lib/planGate";
import type { Plan } from "@/types/database";

type PortfolioContentEditorProps = {
  open: boolean;
  onClose: () => void;
  timeline: YearBlock[];
  serverTimeline: YearBlock[];
  onApplyTimeline: (next: YearBlock[]) => void;
  intro: SiteIntro;
  onApplyIntro: (patch: Partial<DraftProfileFields>) => void;
  onPersistDrafts: () => Promise<{ error: string | null }>;
  onDiscardDrafts: () => void;
  onAddYear?: (year: number) => void;
  /** Add exactly one year (no range scaffolding). Used by the in-editor year picker. */
  onAddSingleYear?: (year: number) => void;
  /** Delete an empty year block from state and DB. */
  onDeleteYear?: (year: number) => Promise<void>;
  plan?: Plan;
  /** When set, the editor jumps to this year's section on open. */
  openOnYear?: number | null;
};

function sortYearsDesc(t: YearBlock[]): YearBlock[] {
  return [...t].sort((a, b) => b.year - a.year);
}

function replaceYear(
  timeline: YearBlock[],
  year: number,
  patch: Partial<YearBlock>,
): YearBlock[] {
  return timeline.map((b) => (b.year === year ? { ...b, ...patch } : b));
}

function addYearBlock(timeline: YearBlock[], year: number): YearBlock[] {
  if (timeline.some((b) => b.year === year)) return timeline;
  return [...timeline, { year, tagline: "", achievements: [] }].sort(
    (a, b) => b.year - a.year,
  );
}


function newEmptyAchievement(): Achievement {
  return {
    id: crypto.randomUUID(),
    title: "New event",
    description: "",
    body: "",
    categories: [],
    links: [],
  };
}

/**
 * Resize an image file using a canvas and re-encode as JPEG.
 * Keeps the longest side at most `maxDim` pixels and compresses to `quality`.
 * Typical result: a 3MB phone photo → ~150 KB data URL, well under the
 * 1 MB Next.js Server Action body limit even with several images.
 */
function resizeAndEncodeImage(
  file: File,
  maxDim = 1200,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not load image")); };
    img.src = objectUrl;
  });
}

// Max raw file size accepted before resize (protects browser memory from absurdly large files)
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export function PortfolioContentEditor({
  open,
  onClose,
  timeline,
  serverTimeline,
  onApplyTimeline,
  intro,
  onApplyIntro,
  onPersistDrafts,
  onDiscardDrafts,
  onAddYear,
  onAddSingleYear,
  onDeleteYear,
  plan = "free",
  openOnYear = null,
}: PortfolioContentEditorProps) {
  const [saveAck, setSaveAck] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingYear, setAddingYear] = useState(false);
  const [newYearValue, setNewYearValue] = useState(new Date().getFullYear());
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; feature: string; description?: string }>({
    open: false,
    feature: "",
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [confirmDeleteYear, setConfirmDeleteYear] = useState(false);

  // ─── Resize handle ────────────────────────────────────────────────────────
  const MIN_WIDTH = 340;
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const panelRef = useRef<HTMLElement>(null);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelRef.current?.offsetWidth ?? 560;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX; // drag left = wider
      const maxWidth = Math.floor(window.innerWidth * 0.5);
      const next = Math.min(maxWidth, Math.max(MIN_WIDTH, dragStartWidth.current + delta));
      setPanelWidth(next);
    }

    function onUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const years = useMemo(() => sortYearsDesc(timeline), [timeline]);
  const [section, setSection] = useState<"hero" | "year">("hero");
  const [yearIndex, setYearIndex] = useState(0);
  useEffect(() => {
    startTransition(() => {
      setYearIndex((i) => Math.min(i, Math.max(0, years.length - 1)));
    });
    setConfirmDeleteYear(false);
  }, [years.length, yearIndex]);

  // If all year blocks are removed, snap back to Hero before paint so we never render year UI without a block
  useLayoutEffect(() => {
    if (section === "year" && years.length === 0) {
      setSection("hero");
    }
  }, [section, years.length]);

  const showHeroForm = section === "hero" || years.length === 0;
  const clampedYearIndex =
    years.length > 0
      ? Math.min(Math.max(0, yearIndex), years.length - 1)
      : 0;

  // When openOnYear is specified, jump to that year's section as the editor opens
  useEffect(() => {
    if (!open || openOnYear == null) return;
    const idx = years.findIndex((b) => b.year === openOnYear);
    if (idx >= 0) {
      startTransition(() => {
        setSection("year");
        setYearIndex(idx);
      });
    }
  }, [open, openOnYear, years]);

  const block = years.length > 0 ? years[clampedYearIndex] : undefined;
  const heroFields: DraftProfileFields = {
    name: intro.name,
    heroLead: intro.heroLead ?? "",
    role: intro.role,
    bio: intro.bio,
    photoSrc: intro.photoSrc,
  };

  const achievements = block?.achievements ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!block) return;
    const ach = block.achievements;
    if (!ach.some((a) => a.id === selectedId)) {
      startTransition(() => setSelectedId(ach[0]?.id ?? null));
    }
  }, [block, selectedId]);

  const selected = achievements.find((a) => a.id === selectedId) ?? null;

  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [musicPreviewSrc, setMusicPreviewSrc] = useState<string | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);

  useEffect(() => {
    const m = selected?.musicUrl?.trim();
    if (!m) {
      setMusicPreviewSrc(null);
      return;
    }
    if (m.startsWith("http") || m.startsWith("data:")) {
      setMusicPreviewSrc(isDirectPlayableAudioUrl(m) ? m : null);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMusicPreviewSrc(null);
      return;
    }
    let cancelled = false;
    void supabase.storage
      .from(BUCKET_EVENT_IMAGES)
      .createSignedUrl(m, 60 * 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        setMusicPreviewSrc(error ? null : data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.musicUrl]);

  const apply = useCallback(
    (next: YearBlock[]) => {
      onApplyTimeline(next);
    },
    [onApplyTimeline],
  );

  const setTagline = (tagline: string) => {
    if (!block) return;
    apply(replaceYear(timeline, block.year, { tagline }));
  };

  const patchAchievement = (id: string, patch: Partial<Achievement>) => {
    if (!block) return;
    const nextAch = achievements.map((a) =>
      a.id === id ? { ...a, ...patch } : a,
    );
    apply(replaceYear(timeline, block.year, { achievements: nextAch }));
  };

  const fixReplaceYear = (ach: Achievement[]) => {
    if (!block) return;
    apply(replaceYear(timeline, block.year, { achievements: ach }));
  };

  const addEvent = () => {
    const na = newEmptyAchievement();
    fixReplaceYear([...achievements, na]);
    setSelectedId(na.id);
  };

  const summarizeLink = async () => {
    if (!linkUrl.trim() || !selected) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const res = await fetch("/api/summarize-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkUrl.trim() }),
      });
      const data = (await res.json()) as {
        heading1?: string;
        heading2?: string;
        body?: string;
        error?: string;
        upgradeRequired?: boolean;
      };
      if (!res.ok || data.error) {
        setLinkError(data.error ?? "Failed to summarize link.");
        return;
      }
      patchAchievement(selected.id, {
        title: data.heading1 ?? selected.title,
        heading2: data.heading2 || selected.heading2,
        body: data.body ?? selected.body,
        description: data.body ?? selected.description,
        links: [
          ...(selected.links ?? []),
          { label: "Source link", href: linkUrl.trim() },
        ],
      });
      setLinkUrl("");
    } catch {
      setLinkError("Network error. Check your connection.");
    } finally {
      setLinkLoading(false);
    }
  };

  const removeEvent = (id: string) => {
    const next = achievements.filter((a) => a.id !== id);
    fixReplaceYear(next);
    // Clear selection if the deleted event was selected
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected) return;
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    const urls: string[] = [...(selected.images ?? (selected.imageSrc ? [selected.imageSrc] : []))];
    for (const f of files) {
      if (f.size > MAX_IMAGE_BYTES) {
        window.alert(`"${f.name}" is too large (over ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB). Please use a smaller file.`);
        continue;
      }
      try {
        urls.push(await resizeAndEncodeImage(f));
      } catch {
        window.alert(`Could not read "${f.name}".`);
      }
    }
    const uniq = [...new Set(urls.filter(Boolean))];
    if (uniq.length === 0) {
      patchAchievement(selected.id, {
        imageSrc: undefined,
        images: undefined,
      });
      return;
    }
    patchAchievement(selected.id, {
      imageSrc: uniq[0],
      images: uniq.length > 1 ? uniq : undefined,
    });
  };

  const removeImageAt = (index: number) => {
    if (!selected) return;
    const urls =
      selected.images && selected.images.length > 0
        ? [...selected.images]
        : selected.imageSrc
          ? [selected.imageSrc]
          : [];
    urls.splice(index, 1);
    if (urls.length === 0) {
      patchAchievement(selected.id, { imageSrc: undefined, images: undefined });
    } else if (urls.length === 1) {
      patchAchievement(selected.id, { imageSrc: urls[0], images: undefined });
    } else {
      patchAchievement(selected.id, {
        imageSrc: urls[0],
        images: urls,
      });
    }
  };

  const onPickAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !canAccess(plan, "eventAudioUpload")) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      window.alert("Supabase is not configured.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setAudioUploading(true);
    try {
      const old = selected.musicUrl?.trim();
      const oldPath =
        old &&
        !old.startsWith("http") &&
        !old.startsWith("data:")
          ? old
          : null;

      const { path, error } = await uploadEventAudio(
        supabase,
        user.id,
        selected.id,
        file,
      );
      if (error || !path) {
        window.alert(error ?? "Could not upload audio.");
        return;
      }
      if (oldPath) void deleteEventImage(supabase, oldPath);
      patchAchievement(selected.id, { musicUrl: path });
    } finally {
      setAudioUploading(false);
    }
  };

  const removeUploadedAudio = async () => {
    if (!selected?.musicUrl) return;
    const m = selected.musicUrl.trim();
    if (m.startsWith("http") || m.startsWith("data:")) {
      patchAchievement(selected.id, { musicUrl: undefined });
      return;
    }
    const supabase = createBrowserSupabaseClient();
    if (supabase) void deleteEventImage(supabase, m);
    patchAchievement(selected.id, { musicUrl: undefined });
  };

  const onPickHeroPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      window.alert(`Image too large (over ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB). Please use a smaller file.`);
      return;
    }
    try {
      onApplyIntro({ photoSrc: await resizeAndEncodeImage(f, 800) });
    } catch {
      window.alert("Could not read that image.");
    }
  };


  const triggerExport = async (format: "json" | "csv" | "pdf") => {
    if ((format === "pdf" || format === "csv") && plan === "free") {
      setUpgradeModal({
        open: true,
        feature: format === "pdf" ? "PDF Achievement Book export" : "CSV export",
        description:
          format === "pdf"
            ? "Create a beautiful printable PDF of your entire portfolio: cover page, year sections, and all achievements. Upgrade to Pro to unlock it."
            : "Export your portfolio to a spreadsheet for college applications and scholarship forms.",
      });
      return;
    }
    setExportLoading(true);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        window.alert(d.error ?? "Export failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heroportfolio.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Export failed. Try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <AnimatePresence>
    {open && (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 bg-dusk-950/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.aside
        ref={panelRef}
        style={panelWidth ? { maxWidth: `${panelWidth}px` } : undefined}
        className="relative z-10 flex h-full w-full flex-col border-l border-dusk-700/90 bg-dusk-900 shadow-2xl sm:max-w-[min(40vw,560px)]"
        role="dialog"
        aria-modal="true"
        aria-label="Content editor"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      >
        {/* Drag handle — left edge */}
        <div
          role="separator"
          aria-label="Drag to resize editor panel"
          aria-orientation="vertical"
          onMouseDown={onDragStart}
          onDoubleClick={() => setPanelWidth(null)}
          title="Drag to resize · Double-click to reset"
          className="group absolute left-0 top-0 z-20 hidden h-full w-3 -translate-x-full cursor-ew-resize select-none items-center justify-center sm:flex"
        >
          {/* Visual pill — brighter on hover */}
          <div className="h-10 w-1 rounded-full bg-dusk-600/60 transition-colors duration-150 group-hover:bg-umber-400/70" />
        </div>

        <div className="flex items-center justify-between border-b border-dusk-700/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-parchment">Edit content</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="flex size-7 items-center justify-center rounded-lg border border-dusk-600 text-parchment-muted transition hover:border-dusk-500 hover:text-parchment"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
            Section
          </label>
          <select
            value={showHeroForm ? "hero" : String(clampedYearIndex)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "hero") setSection("hero");
              else {
                setSection("year");
                setYearIndex(Number(v));
              }
            }}
            className="mt-1 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
          >
            <option value="hero">Hero</option>
            {years.map((y, i) => (
              <option key={`${i}-${y.year}`} value={i}>
                {y.year}
              </option>
            ))}
          </select>

          {/* Add school year / Remove school year — same row */}
          <div className="mt-2">
            {!addingYear ? (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setAddingYear(true);
                    setConfirmDeleteYear(false);
                    setNewYearValue(new Date().getFullYear());
                  }}
                  className="text-xs font-medium text-umber-300/80 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
                >
                  + Add school year
                </button>

                {/* Remove year — right side, empty years only */}
                {!showHeroForm &&
                  section === "year" &&
                  block &&
                  achievements.length === 0 &&
                  onDeleteYear && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteYear(true)}
                    className="flex items-center gap-1 text-xs text-parchment-muted/40 transition hover:text-red-400/80"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                      <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                    </svg>
                    Remove {block.year}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2000}
                  max={new Date().getFullYear() + 2}
                  value={newYearValue}
                  onChange={(e) => setNewYearValue(Number(e.target.value))}
                  className="w-24 rounded-lg border border-dusk-600 bg-dusk-850 px-2 py-1.5 text-sm text-parchment focus:border-umber-400/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = addYearBlock(timeline, newYearValue);
                    onApplyTimeline(next);
                    // Single-year add: only persist this one year, no range scaffolding
                    if (onAddSingleYear) onAddSingleYear(newYearValue);
                    const idx = sortYearsDesc(next).findIndex(
                      (b) => b.year === newYearValue,
                    );
                    if (idx >= 0) {
                      startTransition(() => {
                        setSection("year");
                        setYearIndex(idx);
                      });
                    }
                    setAddingYear(false);
                  }}
                  className="rounded-lg border border-umber-500/40 bg-umber-500/15 px-3 py-1.5 text-xs font-medium text-umber-200 transition hover:bg-umber-500/25"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAddingYear(false)}
                  className="text-xs text-parchment-muted transition hover:text-parchment"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {showHeroForm ? (
            <div className="mt-4 space-y-3 border-t border-dusk-700/60 pt-4">
              <Field label="Display name">
                <input
                  value={heroFields.name}
                  onChange={(e) => onApplyIntro({ name: e.target.value })}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                />
              </Field>
              <Field label="Lead line (e.g. I'm, Hello, I'm)">
                <input
                  value={heroFields.heroLead}
                  onChange={(e) => onApplyIntro({ heroLead: e.target.value })}
                  placeholder="Leave empty to hide"
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                />
              </Field>
              <Field label="Role / subtitle">
                <input
                  value={heroFields.role}
                  onChange={(e) => onApplyIntro({ role: e.target.value })}
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                />
              </Field>
              <Field label="Bio">
                <textarea
                  value={heroFields.bio}
                  onChange={(e) => onApplyIntro({ bio: e.target.value })}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                />
              </Field>
              <Field label="Profile photo">
                <div className="mt-1 flex items-center gap-3">
                  {/* Preview */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroFields.photoSrc || "/avatar-placeholder.svg"}
                    alt="Profile preview"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover border border-dusk-600"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="cursor-pointer rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-1.5 text-center text-xs text-parchment-muted hover:border-umber-500/40 hover:text-parchment">
                      Upload new photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPickHeroPhoto}
                      />
                    </label>
                    {heroFields.photoSrc &&
                      heroFields.photoSrc !== "/avatar-placeholder.svg" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onApplyIntro({ photoSrc: "/avatar-placeholder.svg" })
                        }
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400/80 transition hover:border-red-400/50 hover:text-red-400"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>
              </Field>
            </div>
          ) : (
            <>
              {/* Inline confirm for Remove year — above Year tagline */}
              {confirmDeleteYear && onDeleteYear && block && (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-dusk-600 bg-dusk-850 px-3 py-2.5">
                  <p className="text-xs text-parchment-muted">Remove {block.year} permanently?</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteYear(false)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-parchment-muted transition hover:text-parchment"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteYear(false);
                        void onDeleteYear(block.year);
                      }}
                      className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-400/80 transition hover:border-red-400/50 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
                Year tagline
              </label>
              <textarea
                value={block?.tagline ?? ""}
                onChange={(e) => setTagline(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-y rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/50"
              />

              {/* Event picker header — label + count + add + delete in one row */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-parchment-muted">
                  Event
                </span>
                {achievements.length > 0 && (
                  <span className="rounded-full bg-dusk-800 px-1.5 py-0.5 text-[10px] tabular-nums text-parchment-muted/60">
                    {achievements.length}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={addEvent}
                    className="flex items-center gap-1 rounded-lg border border-umber-500/45 bg-umber-500/15 px-2.5 py-1 text-xs font-medium text-umber-300 transition hover:bg-umber-500/25"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                    </svg>
                    Add
                  </button>
                  {selected && (
                    <button
                      type="button"
                      onClick={() => removeEvent(selected.id)}
                      title="Delete this event"
                      className="flex items-center gap-1 rounded-lg border border-red-500/25 bg-transparent px-2.5 py-1 text-xs font-medium text-red-400/70 transition hover:border-red-400/50 hover:bg-red-500/8 hover:text-red-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3">
                        <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {achievements.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-dusk-600 px-3 py-4 text-center text-xs text-parchment-muted/60">
                  No events yet. Click Add to log your first one.
                </p>
              ) : (
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                  className="mt-1.5 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                >
                  {achievements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title || "Untitled"}
                    </option>
                  ))}
                </select>
              )}

              {selected ? (
            <div className="mt-4 space-y-3 border-t border-dusk-700/60 pt-4">

              {/* AI Link Summarizer */}
              <div className="rounded-xl border border-umber-500/30 bg-umber-500/8 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-umber-300">
                  Smart import
                </p>
                <p className="mb-2 text-[11px] leading-relaxed text-parchment-muted">
                  Paste a news or results URL — AI fills the title and description.
                  {plan === "free" && ` ${FREE_AI_LABEL}.`}
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://news-article.com/…"
                    className="min-w-0 flex-1 rounded-lg border border-dusk-600 bg-dusk-850 px-2 py-1.5 text-xs text-parchment placeholder:text-parchment-muted/40"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void summarizeLink();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void summarizeLink()}
                    disabled={linkLoading || !linkUrl.trim()}
                    className="shrink-0 rounded-lg border border-umber-500/40 bg-umber-500/20 px-3 py-1.5 text-xs font-medium text-umber-200 disabled:opacity-50"
                  >
                    {linkLoading ? (
                      <DotLottieReact
                        src="/animations/loading.lottie"
                        autoplay
                        loop
                        className="h-4 w-4"
                      />
                    ) : "Fill"}
                  </button>
                </div>
                {linkError && (
                  <p className="mt-1.5 text-[11px] text-red-400">{linkError}</p>
                )}
              </div>

              <Field label="Heading 1 (title)">
                <input
                  value={selected.title}
                  onChange={(e) =>
                    patchAchievement(selected.id, { title: e.target.value })
                  }
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                />
              </Field>
              <Field label="Heading 2">
                <input
                  value={selected.heading2 ?? ""}
                  onChange={(e) =>
                    patchAchievement(selected.id, {
                      heading2: e.target.value || undefined,
                    })
                  }
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                />
              </Field>
              <Field label="Body">
                <textarea
                  value={selected.body ?? selected.description}
                  onChange={(e) =>
                    patchAchievement(selected.id, {
                      body: e.target.value,
                      description: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full resize-y rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                />
              </Field>
              <Field label="Categories (comma-separated)">
                <input
                  value={(selected.categories ?? []).join(", ")}
                  onChange={(e) => {
                    const cats = e.target.value
                      .split(",")
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean);
                    patchAchievement(selected.id, {
                      categories: cats.length ? cats : undefined,
                    });
                  }}
                  placeholder="music, stem, competition"
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                />
              </Field>

              <Field label="Images (upload)">
                <label className="mt-1 block cursor-pointer rounded-lg border border-dashed border-dusk-600 px-3 py-2 text-center text-xs text-parchment-muted hover:border-umber-500/40 hover:text-parchment">
                  + Add images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onPickImages}
                  />
                </label>
                <ul className="mt-2 space-y-2">
                  {(
                    selected.images ??
                    (selected.imageSrc ? [selected.imageSrc] : [])
                  ).map((src, i) => (
                    <li
                      key={`${selected.id}-ed-${i}`}
                      className="flex items-center gap-2 rounded-lg border border-dusk-700/80 bg-dusk-850/50 p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="size-12 shrink-0 rounded object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAt(i)}
                        className="ml-auto text-xs text-red-400/90"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </Field>

              <Field label="Amount raised (optional, USD)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-parchment-muted/60">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selected.amountRaised ?? ""}
                    onChange={(e) =>
                      patchAchievement(selected.id, {
                        amountRaised: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-dusk-600 bg-dusk-850 py-2 pl-6 pr-3 text-sm text-parchment placeholder:text-parchment-muted/40"
                  />
                </div>
                <p className="mt-1 text-[11px] text-parchment-muted/50">
                  For fundraising or donation events. Counts toward your lifetime total on the Badges page.
                </p>
              </Field>

              <Field label="Video link (YouTube / Vimeo)">
                <div className="flex gap-2">
                  <input
                    value={selected.videoUrl ?? ""}
                    onChange={(e) =>
                      patchAchievement(selected.id, {
                        videoUrl: e.target.value || undefined,
                      })
                    }
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="min-w-0 flex-1 rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                  />
                  <button
                    type="button"
                    title={plan === "pro" ? "Upload video file (Pro)" : "Upgrade to Pro to upload video files"}
                    onClick={() => {
                      if (plan !== "pro") {
                        window.alert("Video file uploads are a Pro feature. Upgrade to Pro to upload your own videos directly.");
                        return;
                      }
                      // Pro: trigger file picker (placeholder — wire to storage upload)
                      window.alert("Video upload coming soon. For now, paste a YouTube or Vimeo link.");
                    }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      plan === "pro"
                        ? "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-500 hover:text-parchment"
                        : "border-umber-500/35 bg-umber-500/10 text-umber-300 hover:bg-umber-500/18"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0" aria-hidden>
                      <path d="M8 1a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H1.75a.75.75 0 0 1 0-1.5h5.5V1.75A.75.75 0 0 1 8 1Z" />
                    </svg>
                    {plan === "pro" ? "Upload" : (
                      <span className="flex items-center gap-1">
                        Upload
                        <span className="rounded-full bg-umber-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-umber-200">Pro</span>
                      </span>
                    )}
                  </button>
                </div>
              </Field>

              <Field label="Music (Spotify / SoundCloud / Pro upload)">
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.webm,audio/*"
                  className="hidden"
                  onChange={onPickAudio}
                />
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={
                        selected.musicUrl &&
                        (selected.musicUrl.startsWith("http") ||
                          selected.musicUrl.startsWith("data:"))
                          ? selected.musicUrl
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        const prev = selected.musicUrl?.trim();
                        if (
                          prev &&
                          !prev.startsWith("http") &&
                          !prev.startsWith("data:")
                        ) {
                          const supabase = createBrowserSupabaseClient();
                          if (supabase) void deleteEventImage(supabase, prev);
                        }
                        patchAchievement(selected.id, {
                          musicUrl: v || undefined,
                        });
                      }}
                      placeholder="https://open.spotify.com/track/… or SoundCloud"
                      className="min-w-0 flex-1 rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                    />
                    <button
                      type="button"
                      title={
                        canAccess(plan, "eventAudioUpload")
                          ? "Upload MP3, WAV, M4A, AAC, OGG, FLAC, or WebM"
                          : "Upgrade to Pro to upload audio files"
                      }
                      disabled={audioUploading}
                      onClick={() => {
                        if (!canAccess(plan, "eventAudioUpload")) {
                          window.alert(
                            "Audio file uploads are a Pro feature. Upgrade to Pro to upload your own recordings.",
                          );
                          return;
                        }
                        audioFileInputRef.current?.click();
                      }}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
                        canAccess(plan, "eventAudioUpload")
                          ? "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-500 hover:text-parchment"
                          : "border-umber-500/35 bg-umber-500/10 text-umber-300 hover:bg-umber-500/18"
                      }`}
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0" aria-hidden>
                        <path d="M8 1a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H1.75a.75.75 0 0 1 0-1.5h5.5V1.75A.75.75 0 0 1 8 1Z" />
                      </svg>
                      {audioUploading
                        ? "…"
                        : canAccess(plan, "eventAudioUpload")
                          ? "Upload"
                          : (
                              <span className="flex items-center gap-1">
                                Upload
                                <span className="rounded-full bg-umber-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-umber-200">
                                  Pro
                                </span>
                              </span>
                            )}
                    </button>
                  </div>
                  {selected.musicUrl &&
                  !selected.musicUrl.startsWith("http") &&
                  !selected.musicUrl.startsWith("data:") ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dusk-700/80 bg-dusk-850/60 px-3 py-2 text-xs text-parchment-muted">
                      <span>Uploaded audio file (saved with your portfolio)</span>
                      <button
                        type="button"
                        onClick={() => void removeUploadedAudio()}
                        className="text-red-400/90 underline decoration-red-500/40"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  {musicPreviewSrc ? (
                    <audio
                      controls
                      preload="metadata"
                      src={musicPreviewSrc}
                      className="w-full rounded-lg border border-dusk-700/80 bg-dusk-900/40 p-2"
                    />
                  ) : null}
                  <p className="text-[11px] text-parchment-muted/50">
                    Pro: upload WAV, MP3, and more (max{" "}
                    {Math.round(MAX_EVENT_AUDIO_BYTES / (1024 * 1024))} MB). Links stay free for everyone.
                  </p>
                </div>
              </Field>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-parchment-muted">
                  Links
                </span>
                {(selected.links?.length
                  ? selected.links
                  : [{ label: "", href: "" }]
                ).map((link, i) => (
                  <div key={i} className="flex flex-col gap-1 sm:flex-row">
                    <input
                      value={link.label}
                      onChange={(e) => {
                        const base =
                          selected.links?.length ?? 0
                            ? [...selected.links!]
                            : [{ label: "", href: "" }];
                        while (base.length <= i) base.push({ label: "", href: "" });
                        base[i] = { ...base[i], label: e.target.value };
                        patchAchievement(selected.id, { links: base });
                      }}
                      placeholder="Label"
                      className="flex-1 rounded-lg border border-dusk-600 bg-dusk-850 px-2 py-1.5 text-xs text-parchment"
                    />
                    <input
                      value={link.href}
                      onChange={(e) => {
                        const base =
                          selected.links?.length ?? 0
                            ? [...selected.links!]
                            : [{ label: "", href: "" }];
                        while (base.length <= i) base.push({ label: "", href: "" });
                        base[i] = { ...base[i], href: e.target.value };
                        patchAchievement(selected.id, { links: base });
                      }}
                      placeholder="https://…"
                      className="min-w-0 flex-[2] rounded-lg border border-dusk-600 bg-dusk-850 px-2 py-1.5 text-xs text-parchment"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    patchAchievement(selected.id, {
                      links: [
                        ...(selected.links?.length
                          ? selected.links
                          : [{ label: "", href: "" }]),
                        { label: "", href: "" },
                      ],
                    })
                  }
                  className="text-xs text-umber-300 hover:text-umber-200"
                >
                  + Add link row
                </button>
              </div>
            </div>
          ) : null}
            </>
          )}
        </div>

        {/* Save overlay — dims the whole panel and plays confetti centered */}
        <AnimatePresence>
          {saveAck && (
            <motion.div
              className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-none bg-dusk-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DotLottieReact
                src="/animations/saved_confetti.lottie"
                autoplay
                speed={1.8}
                className="h-48 w-48"
              />
              <p className="text-base font-semibold text-parchment">Saved ✓</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-dusk-700/80 px-4 py-3">
          {saveError && (
            <p className="mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {saveError}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onDiscardDrafts();
                onClose();
              }}
              className="flex-1 rounded-lg border border-dusk-600 bg-dusk-850 py-2 text-sm font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setSaving(true);
                setSaveError(null);
                void onPersistDrafts().then(({ error }) => {
                  setSaving(false);
                  if (error) {
                    setSaveError(`Save failed: ${error}`);
                  } else {
                    setSaveAck(true);
                    window.setTimeout(() => setSaveAck(false), 2200);
                  }
                });
              }}
              className="relative flex-1 overflow-hidden rounded-lg border border-umber-500/50 bg-umber-500/20 py-2 text-sm font-medium text-umber-200 transition hover:bg-umber-500/30 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </motion.aside>

      <UpgradeModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal((u) => ({ ...u, open: false }))}
        featureName={upgradeModal.feature}
        description={upgradeModal.description}
      />
    </div>
    )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-parchment-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
