"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { Achievement, SiteIntro, YearBlock } from "@/data/timeline";
import type { DraftProfileFields } from "@/lib/draftProfileIntro";
import { UpgradeModal } from "@/components/UpgradeModal";

type PortfolioContentEditorProps = {
  open: boolean;
  onClose: () => void;
  timeline: YearBlock[];
  serverTimeline: YearBlock[];
  onApplyTimeline: (next: YearBlock[]) => void;
  intro: SiteIntro;
  onApplyIntro: (patch: Partial<DraftProfileFields>) => void;
  onPersistDrafts: () => void;
  onDiscardDrafts: () => void;
  onAddYear?: (year: number) => void;
  plan?: "free" | "pro";
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
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: "New event",
    description: "",
    body: "",
    categories: [],
    links: [],
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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
  plan = "free",
}: PortfolioContentEditorProps) {
  const [saveAck, setSaveAck] = useState(false);
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
  }, [years.length]);

  // Auto-revert to "hero" if all year blocks are gone to prevent a null crash
  useEffect(() => {
    if (section === "year" && years.length === 0) {
      startTransition(() => setSection("hero"));
    }
  }, [section, years.length]);

  const block = years[yearIndex] ?? years[0];
  const year = block?.year ?? new Date().getFullYear();
  const heroFields: DraftProfileFields = {
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

  const apply = useCallback(
    (next: YearBlock[]) => {
      onApplyTimeline(next);
    },
    [onApplyTimeline],
  );

  const setTagline = (tagline: string) => {
    apply(replaceYear(timeline, year, { tagline }));
  };

  const patchAchievement = (id: string, patch: Partial<Achievement>) => {
    const nextAch = achievements.map((a) =>
      a.id === id ? { ...a, ...patch } : a,
    );
    apply(replaceYear(timeline, year, { achievements: nextAch }));
  };

  const fixReplaceYear = (ach: Achievement[]) => {
    apply(replaceYear(timeline, year, { achievements: ach }));
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
        window.alert(
          `Skipped "${f.name}" (over ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB). Compress or add a link instead.`,
        );
        continue;
      }
      try {
        urls.push(await readFileAsDataUrl(f));
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

  const exportYearJson = () => {
    const payload = {
      tagline: block.tagline,
      events: achievements.map((a) => ({
        id: a.id,
        heading1: a.title,
        heading2: a.heading2,
        heading3: a.heading3,
        body: a.body ?? a.description,
        images:
          a.images && a.images.length > 0
            ? a.images
            : a.imageSrc
              ? [a.imageSrc]
              : undefined,
        categories: a.categories?.length ? a.categories : undefined,
        videoUrl: a.videoUrl,
        musicUrl: a.musicUrl,
        links: a.links?.filter((l) => l.href.trim()).length
          ? a.links.filter((l) => l.href.trim())
          : undefined,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `events-${year}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onPickHeroPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      window.alert(
        `Image too large (over ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB). Compress or use a path under public/ instead.`,
      );
      return;
    }
    try {
      onApplyIntro({ photoSrc: await readFileAsDataUrl(f) });
    } catch {
      window.alert("Could not read that image.");
    }
  };

  const exportProfileJson = () => {
    const payload = {
      heroLead: heroFields.heroLead.trim() === "" ? undefined : heroFields.heroLead,
      role: heroFields.role,
      bio: heroFields.bio,
      photoSrc: heroFields.photoSrc,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "profile.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importProfileJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Record<
          string,
          unknown
        >;
        const role = typeof data.role === "string" ? data.role : intro.role;
        const bio = typeof data.bio === "string" ? data.bio : intro.bio;
        const photoSrc =
          typeof data.photoSrc === "string" ? data.photoSrc : intro.photoSrc;
        let heroLead = heroFields.heroLead;
        if ("heroLead" in data) {
          heroLead =
            typeof data.heroLead === "string" ? data.heroLead : "";
        }
        onApplyIntro({ role, bio, photoSrc, heroLead });
      } catch {
        window.alert("Could not parse profile JSON.");
      }
    };
    reader.readAsText(file);
  };

  const importYearJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as {
          tagline?: string;
          events?: unknown[];
        };
        if (!data.events || !Array.isArray(data.events)) {
          window.alert("Invalid JSON: need an `events` array.");
          return;
        }
        const tagline =
          typeof data.tagline === "string" && data.tagline.trim()
            ? data.tagline.trim()
            : block.tagline;
        const mapped: Achievement[] = data.events.map((ev, i) => {
          const o = ev as Record<string, unknown>;
          const imgs = Array.isArray(o.images)
            ? (o.images as string[]).filter(Boolean)
            : [];
          const catsRaw = [
            ...(typeof o.category === "string" ? [o.category] : []),
            ...(Array.isArray(o.categories) ? (o.categories as string[]) : []),
          ];
          const categories = [
            ...new Set(
              catsRaw.map((c) => String(c).trim().toLowerCase()).filter(Boolean),
            ),
          ];
          return {
            id: String(o.id ?? `imported-${year}-${i}`),
            title: String(o.heading1 ?? "Untitled"),
            heading2: o.heading2 ? String(o.heading2) : undefined,
            heading3: o.heading3 ? String(o.heading3) : undefined,
            body: o.body ? String(o.body) : undefined,
            description: String(o.body ?? ""),
            ...(imgs.length
              ? {
                  imageSrc: imgs[0],
                  images: imgs.length > 1 ? imgs : undefined,
                }
              : {}),
            videoUrl: o.videoUrl ? String(o.videoUrl) : undefined,
            musicUrl: o.musicUrl ? String(o.musicUrl) : undefined,
            links: Array.isArray(o.links)
              ? (o.links as { label: string; href: string }[])
              : undefined,
            categories: categories.length ? categories : undefined,
          };
        });
        apply(replaceYear(timeline, year, { tagline, achievements: mapped }));
        setSelectedId(mapped[0]?.id ?? null);
      } catch {
        window.alert("Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  const triggerExport = async (format: "json" | "csv" | "pdf") => {
    if ((format === "pdf" || format === "csv") && plan === "free") {
      setUpgradeModal({
        open: true,
        feature: format === "pdf" ? "PDF Achievement Book export" : "CSV export",
        description:
          format === "pdf"
            ? "Create a beautiful printable PDF of your entire portfolio — cover page, year sections, and all achievements. Upgrade to Pro to unlock it."
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
            value={section === "hero" ? "hero" : String(yearIndex)}
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
            <option value="hero">Hero / Profile</option>
            {years.map((y, i) => (
              <option key={`${i}-${y.year}`} value={i}>
                {y.year}
              </option>
            ))}
          </select>

          {/* Add school year */}
          <div className="mt-2">
            {!addingYear ? (
              <button
                type="button"
                onClick={() => {
                  setAddingYear(true);
                  setNewYearValue(new Date().getFullYear());
                }}
                className="text-xs font-medium text-umber-300/80 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
              >
                + Add school year
              </button>
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
                    if (onAddYear) onAddYear(newYearValue);
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

          {section === "hero" ? (
            <div className="mt-4 space-y-3 border-t border-dusk-700/60 pt-4">
              <p className="text-[11px] text-parchment-muted">
                Your name comes from your account. Changes here save to the cloud automatically.
              </p>
              <Field label="Lead line (e.g. I'm)">
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
                        className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs text-red-400 hover:text-red-300"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>
              </Field>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportProfileJson}
                  className="rounded-full border border-dusk-600 bg-dusk-850 px-3 py-1.5 text-xs font-medium text-parchment-muted"
                >
                  Export profile.json
                </button>
                <label className="cursor-pointer rounded-full border border-dusk-600 bg-dusk-850 px-3 py-1.5 text-xs font-medium text-parchment-muted hover:text-parchment">
                  Import profile.json
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) importProfileJson(f);
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
                Year tagline
              </label>
              <textarea
                value={block.tagline}
                onChange={(e) => setTagline(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-y rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/50"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addEvent}
                  className="rounded-full border border-umber-500/45 bg-umber-500/15 px-3 py-1.5 text-xs font-medium text-umber-300"
                >
                  + Add event
                </button>
                <button
                  type="button"
                  onClick={exportYearJson}
                  className="rounded-full border border-dusk-600 bg-dusk-850 px-3 py-1.5 text-xs font-medium text-parchment-muted"
                >
                  Export JSON
                </button>
                <label className="cursor-pointer rounded-full border border-dusk-600 bg-dusk-850 px-3 py-1.5 text-xs font-medium text-parchment-muted hover:text-parchment">
                  Import JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) importYearJson(f);
                    }}
                  />
                </label>
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
                Event
              </label>
              {achievements.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-dusk-600 px-3 py-4 text-center text-xs text-parchment-muted/60">
                  No events yet. Click &quot;+ Add event&quot; above to log your first one.
                </p>
              ) : (
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                  className="mt-1 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
                >
                  {achievements.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title || a.id}
                    </option>
                  ))}
                </select>
              )}

              {selected ? (
            <div className="mt-4 space-y-3 border-t border-dusk-700/60 pt-4">
              <button
                type="button"
                onClick={() => removeEvent(selected.id)}
                className="text-xs text-red-400/90 hover:text-red-300"
              >
                Delete this event
              </button>

              {/* AI Link Summarizer */}
              <div className="rounded-xl border border-umber-500/30 bg-umber-500/8 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-umber-300">
                  Smart import — paste a news link
                </p>
                <p className="mb-2 text-[11px] leading-relaxed text-parchment-muted">
                  Paste an article or competition results URL and AI will auto-fill the title, subtitle, and description.
                  {plan === "free" && " (3 uses/month free)"}
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
              <Field label="Heading 3">
                <input
                  value={selected.heading3 ?? ""}
                  onChange={(e) =>
                    patchAchievement(selected.id, {
                      heading3: e.target.value || undefined,
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

              <Field label="Video link (YouTube / Vimeo)">
                <input
                  value={selected.videoUrl ?? ""}
                  onChange={(e) =>
                    patchAchievement(selected.id, {
                      videoUrl: e.target.value || undefined,
                    })
                  }
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                />
              </Field>
              <Field label="Music link (Spotify / SoundCloud)">
                <input
                  value={selected.musicUrl ?? ""}
                  onChange={(e) =>
                    patchAchievement(selected.id, {
                      musicUrl: e.target.value || undefined,
                    })
                  }
                  placeholder="https://open.spotify.com/track/…"
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment placeholder:text-parchment-muted/40"
                />
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

        <div className="border-t border-dusk-700/80 px-4 py-3">
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
              onClick={() => {
                onPersistDrafts();
                setSaveAck(true);
                window.setTimeout(() => setSaveAck(false), 2200);
              }}
              className="relative flex-1 overflow-hidden rounded-lg border border-umber-500/50 bg-umber-500/20 py-2 text-sm font-medium text-umber-200 transition hover:bg-umber-500/30"
            >
              {saveAck ? (
                <span className="flex items-center justify-center gap-1.5">
                  <DotLottieReact
                    src="/animations/saved_confetti.lottie"
                    autoplay
                    className="h-5 w-5 shrink-0"
                  />
                  Saved ✓
                </span>
              ) : "Save"}
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
