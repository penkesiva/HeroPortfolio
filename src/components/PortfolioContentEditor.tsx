"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Achievement, YearBlock } from "@/data/timeline";
import { clearDraftTimeline } from "@/lib/draftTimeline";

type PortfolioContentEditorProps = {
  open: boolean;
  onClose: () => void;
  timeline: YearBlock[];
  serverTimeline: YearBlock[];
  onApplyTimeline: (next: YearBlock[]) => void;
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
}: PortfolioContentEditorProps) {
  const [saveAck, setSaveAck] = useState(false);

  const years = useMemo(() => sortYearsDesc(timeline), [timeline]);
  const [yearIndex, setYearIndex] = useState(0);
  useEffect(() => {
    startTransition(() => {
      setYearIndex((i) => Math.min(i, Math.max(0, years.length - 1)));
    });
  }, [years.length]);

  const block = years[yearIndex] ?? years[0];
  const year = block?.year ?? new Date().getFullYear();

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

  const removeEvent = (id: string) => {
    const next = achievements.filter((a) => a.id !== id);
    fixReplaceYear(next.length ? next : [newEmptyAchievement()]);
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

  if (!open || !block) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close editor"
        className="absolute inset-0 bg-dusk-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-dusk-700/90 bg-dusk-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Content editor"
      >
        <div className="flex items-center justify-between border-b border-dusk-700/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-parchment">Edit content</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-dusk-600 px-2 py-1 text-xs text-parchment-muted hover:text-parchment"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-4 text-xs leading-relaxed text-parchment-muted">
            Edits save <strong className="font-medium text-parchment/90">automatically</strong> in this
            browser (local storage) as you type. Use{" "}
            <strong className="font-medium text-parchment/90">Save draft</strong> below if you want a
            visible confirmation. Export{" "}
            <code className="text-umber-300/90">events.json</code> for GitHub. Spotify / SoundCloud /
            YouTube links embed when supported.
          </p>

          <label className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
            Year
          </label>
          <select
            value={yearIndex}
            onChange={(e) => setYearIndex(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2 text-sm text-parchment"
          >
            {years.map((y, i) => (
              <option key={y.year} value={i}>
                {y.year}
              </option>
            ))}
          </select>

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

          {selected ? (
            <div className="mt-4 space-y-3 border-t border-dusk-700/60 pt-4">
              <button
                type="button"
                onClick={() => removeEvent(selected.id)}
                className="text-xs text-red-400/90 hover:text-red-300"
              >
                Delete this event
              </button>

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
        </div>

        <div className="border-t border-dusk-700/80 p-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              onApplyTimeline(timeline);
              setSaveAck(true);
              window.setTimeout(() => setSaveAck(false), 2200);
            }}
            className="w-full rounded-lg border border-umber-500/50 bg-umber-500/20 py-2.5 text-sm font-medium text-umber-200 transition hover:bg-umber-500/30"
          >
            Save draft
          </button>
          {saveAck ? (
            <p className="text-center text-xs font-medium text-umber-300" role="status">
              Saved in this browser.
            </p>
          ) : (
            <p className="text-center text-[11px] text-parchment-muted/90">
              Auto-saves while you edit; this button re-writes storage and confirms.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              clearDraftTimeline();
              onApplyTimeline(serverTimeline);
              onClose();
            }}
            className="w-full rounded-lg border border-dusk-600 bg-dusk-850 py-2 text-xs font-medium text-parchment-muted hover:text-parchment"
          >
            Discard draft &amp; reload from site
          </button>
        </div>
      </aside>
    </div>
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
