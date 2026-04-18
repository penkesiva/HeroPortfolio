"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AlbumPhoto = {
  src: string;
  eventTitle: string;
  year: number;
  categories: string[];
};

function isDataUrl(src: string) {
  return src.startsWith("data:");
}

export function AlbumGrid({ photos }: { photos: AlbumPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const years = [...new Set(photos.map((p) => p.year))].sort((a, b) => b - a);

  const filtered = yearFilter
    ? photos.filter((p) => p.year === yearFilter)
    : photos;

  const openLightbox = useCallback((i: number) => setLightboxIndex(i), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : i === 0 ? filtered.length - 1 : i - 1,
    );
  }, [filtered.length]);
  const next = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : i === filtered.length - 1 ? 0 : i + 1,
    );
  }, [filtered.length]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dusk-700/60 py-24 text-center">
        <div className="mb-4 text-4xl opacity-30">🖼</div>
        <p className="text-sm text-parchment-muted">
          Photos you add to events will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Year filter chips */}
      {years.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setYearFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              yearFilter === null
                ? "bg-umber-500/25 text-umber-200"
                : "border border-dusk-600 text-parchment-muted hover:text-parchment"
            }`}
          >
            All years
          </button>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYearFilter(y)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                yearFilter === y
                  ? "bg-umber-500/25 text-umber-200"
                  : "border border-dusk-600 text-parchment-muted hover:text-parchment"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {/* Masonry grid */}
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {filtered.map((photo, i) => (
          <motion.button
            key={`${photo.src}-${i}`}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            onClick={() => openLightbox(i)}
            className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl border border-dusk-700/60 bg-dusk-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-umber-400"
          >
            <div className="relative aspect-[4/3]">
              {isDataUrl(photo.src) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.eventTitle}
                  className="size-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <Image
                  src={photo.src}
                  alt={photo.eventTitle}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dusk-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-1 px-3 py-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="truncate text-[11px] font-medium text-parchment">
                  {photo.eventTitle}
                </p>
                <p className="text-[10px] text-parchment-muted">{photo.year}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-dusk-950/95 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            {/* Close */}
            <button
              type="button"
              aria-label="Close"
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded-full bg-dusk-900/80 p-2 text-parchment-muted hover:text-parchment"
            >
              <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            {/* Prev */}
            {filtered.length > 1 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={prev}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-dusk-900/80 p-3 text-parchment-muted hover:text-parchment"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-16 flex max-h-[85vh] max-w-4xl flex-col items-center"
            >
              <div className="relative max-h-[70vh] w-full">
                {isDataUrl(filtered[lightboxIndex]!.src) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filtered[lightboxIndex]!.src}
                    alt={filtered[lightboxIndex]!.eventTitle}
                    className="max-h-[70vh] w-auto rounded-xl object-contain"
                  />
                ) : (
                  <div className="relative h-[60vh] w-[80vw] max-w-3xl">
                    <Image
                      src={filtered[lightboxIndex]!.src}
                      alt={filtered[lightboxIndex]!.eventTitle}
                      fill
                      className="rounded-xl object-contain"
                      sizes="80vw"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <p className="font-medium text-parchment">
                  {filtered[lightboxIndex]!.eventTitle}
                </p>
                <p className="mt-0.5 text-sm text-parchment-muted">
                  {filtered[lightboxIndex]!.year}
                  {filtered[lightboxIndex]!.categories.length > 0 &&
                    ` · ${filtered[lightboxIndex]!.categories.join(", ")}`}
                </p>
                <p className="mt-2 text-xs text-parchment-muted/60">
                  {lightboxIndex + 1} / {filtered.length}
                </p>
              </div>
            </motion.div>

            {/* Next */}
            {filtered.length > 1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={next}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-dusk-900/80 p-3 text-parchment-muted hover:text-parchment"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}

            {/* Keyboard navigation */}
            <KeyboardHandler prev={prev} next={next} close={closeLightbox} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function KeyboardHandler({
  prev,
  next,
  close,
}: {
  prev: () => void;
  next: () => void;
  close: () => void;
}) {
  // Use a simple effect via a hidden element
  if (typeof window !== "undefined") {
    // Attach once via event delegation
  }
  return (
    <div
      className="sr-only"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
        if (e.key === "Escape") close();
      }}
    />
  );
}
