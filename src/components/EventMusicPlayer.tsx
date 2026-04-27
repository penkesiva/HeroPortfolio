"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { MusicNoteGlyph } from "@/components/icons/MusicNoteGlyph";
import { isDirectPlayableAudioUrl, musicUrlToEmbedSrc } from "@/lib/embedUrls";
import { BUCKET_EVENT_IMAGES } from "@/lib/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  title: string;
  musicUrl: string;
  /** When set, floating notes render over this element (e.g. the event card). */
  floatingNotesPortalRef?: RefObject<HTMLElement | null>;
};

type Corner = { top?: string; left?: string; right?: string; bottom?: string };

/** Stable 0–1 from (note index, salt); avoids hydration drift vs random(). */
function unitNoise(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 43758.5453) * 43758.5453;
  return x - Math.floor(x);
}

/** Closed loop of irregular samples so motion never shares one simple back-and-forth. */
function wanderKeyframes(
  i: number,
  salt: number,
  interior: number,
  amp: number
): number[] {
  const out: number[] = [0];
  for (let k = 0; k < interior; k++) {
    out.push((unitNoise(i, salt + k * 0.17) * 2 - 1) * amp);
  }
  out.push(0);
  return out;
}

type NoteDriftPlan = {
  position: Corner;
  delay: number;
  x: number[];
  y: number[];
  rotate: number[];
  opacity: number[];
  durX: number;
  durY: number;
  durR: number;
  durOpacity: number;
};

function buildNoteDriftPlans(): NoteDriftPlan[] {
  const layout: { position: Corner; delay: number }[] = [
    { position: { top: "8%", left: "6%" }, delay: 0 },
    { position: { top: "14%", right: "8%" }, delay: 0.35 },
    { position: { top: "42%", left: "4%" }, delay: 0.7 },
    { position: { top: "52%", right: "6%" }, delay: 1.05 },
    { position: { bottom: "18%", left: "12%" }, delay: 1.4 },
    { position: { bottom: "12%", right: "10%" }, delay: 1.75 },
  ];

  return layout.map(({ position, delay }, i) => ({
    position,
    delay,
    x: wanderKeyframes(i, 0, 8, 20),
    y: wanderKeyframes(i, 4.2, 7, 24),
    rotate: wanderKeyframes(i, 8.1, 6, 16),
    opacity: [
      0.2,
      0.45 + unitNoise(i, 30) * 0.28,
      0.28 + unitNoise(i, 31) * 0.2,
      0.62 + unitNoise(i, 32) * 0.18,
      0.32,
      0.55 + unitNoise(i, 33) * 0.2,
      0.2,
    ],
    durX: 2.6 + unitNoise(i, 40) * 4.2,
    durY: 3.1 + unitNoise(i, 41) * 4.8,
    durR: 2.2 + unitNoise(i, 42) * 3.6,
    durOpacity: 1.8 + unitNoise(i, 43) * 2.4,
  }));
}

const NOTE_DRIFT_PLANS = buildNoteDriftPlans();

function FloatingMusicNotesLayer({ playing }: { playing: boolean }) {
  return (
    <div
      className={`event-music-notes-overlay pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out ${
        playing ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden
    >
      {NOTE_DRIFT_PLANS.map((plan, i) => (
        <motion.span
          key={i}
          className="event-music-note text-umber-300/45"
          style={plan.position}
          initial={false}
          animate={
            playing
              ? {
                  x: plan.x,
                  y: plan.y,
                  rotate: plan.rotate,
                  opacity: plan.opacity,
                }
              : {
                  x: 0,
                  y: 0,
                  rotate: plan.rotate[0] ?? 0,
                  opacity: 0,
                }
          }
          transition={{
            x: {
              duration: plan.durX,
              repeat: playing ? Infinity : 0,
              ease: "easeInOut",
              delay: plan.delay,
            },
            y: {
              duration: plan.durY,
              repeat: playing ? Infinity : 0,
              ease: "easeInOut",
              delay: plan.delay * 0.4,
            },
            rotate: {
              duration: plan.durR,
              repeat: playing ? Infinity : 0,
              ease: "easeInOut",
              delay: plan.delay * 0.65,
            },
            opacity: {
              duration: plan.durOpacity,
              repeat: playing ? Infinity : 0,
              ease: "easeInOut",
              delay: plan.delay * 0.2,
            },
          }}
        >
          <MusicNoteGlyph className="size-4 sm:size-5" />
        </motion.span>
      ))}
    </div>
  );
}

function PlayableAudioWithFloatingNotes({
  src,
  title,
  floatingNotesPortalRef,
}: {
  src: string;
  title: string;
  floatingNotesPortalRef?: RefObject<HTMLElement | null>;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!floatingNotesPortalRef) {
      setPortalEl(null);
      return;
    }
    setPortalEl(floatingNotesPortalRef.current);
  }, [floatingNotesPortalRef, src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const notesInCard =
    portalEl && floatingNotesPortalRef
      ? createPortal(
          <FloatingMusicNotesLayer playing={playing} />,
          portalEl
        )
      : null;

  return (
    <>
      {notesInCard}
      {!floatingNotesPortalRef ? (
        <div
          className={`event-music-float-wrap rounded-xl border border-dusk-700/80 bg-dusk-850/80 p-3 ${
            playing ? "event-music-float-wrap--playing" : ""
          }`}
        >
          <div className="event-music-notes">
            <FloatingMusicNotesLayer playing={playing} />
          </div>
          <audio
            ref={audioRef}
            controls
            controlsList="nodownload"
            preload="metadata"
            src={src}
            className="w-full"
            title={title}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dusk-700/80 bg-dusk-850/80 p-3">
          <audio
            ref={audioRef}
            controls
            controlsList="nodownload"
            preload="metadata"
            src={src}
            className="w-full"
            title={title}
          />
        </div>
      )}
    </>
  );
}

/**
 * Renders event music: Spotify/SoundCloud embed, signed storage path, or direct / external link.
 * Raw `userId/.../audio-*.mp3` paths must be signed — they are not valid browser URLs alone.
 */
export function EventMusicPlayer({
  title,
  musicUrl,
  floatingNotesPortalRef,
}: Props) {
  const trimmed = musicUrl.trim();
  if (!trimmed) return null;

  const embed = musicUrlToEmbedSrc(trimmed);
  if (embed) {
    return (
      <div className="overflow-hidden rounded-xl border border-dusk-700/80 bg-black/30">
        <iframe
          title={`${title}: music`}
          src={embed}
          className="h-[180px] w-full sm:h-[232px]"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (isDirectPlayableAudioUrl(trimmed) || trimmed.startsWith("data:")) {
    return (
      <PlayableAudioWithFloatingNotes
        src={trimmed}
        title={title}
        floatingNotesPortalRef={floatingNotesPortalRef}
      />
    );
  }

  if (trimmed.startsWith("http")) {
    return (
      <Link
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-dusk-600 bg-dusk-850 px-4 py-2 text-sm font-medium text-parchment-muted transition hover:border-dusk-600 hover:text-parchment"
      >
        Open music link
      </Link>
    );
  }

  return (
    <SignedStorageAudio
      path={trimmed}
      title={title}
      floatingNotesPortalRef={floatingNotesPortalRef}
    />
  );
}

function SignedStorageAudio({
  path,
  title,
  floatingNotesPortalRef,
}: {
  path: string;
  title: string;
  floatingNotesPortalRef?: RefObject<HTMLElement | null>;
}) {
  const [playSrc, setPlaySrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setPlaySrc(null);
    let cancelled = false;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setError(true);
      return;
    }
    void supabase.storage
      .from(BUCKET_EVENT_IMAGES)
      .createSignedUrl(path, 60 * 60 * 24 * 365)
      .then(({ data, error: signErr }) => {
        if (cancelled) return;
        if (signErr || !data?.signedUrl) {
          setError(true);
          return;
        }
        setPlaySrc(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (playSrc) {
    return (
      <PlayableAudioWithFloatingNotes
        src={playSrc}
        title={title}
        floatingNotesPortalRef={floatingNotesPortalRef}
      />
    );
  }

  if (error) {
    return (
      <p className="text-xs text-parchment-muted">
        Could not load this audio file. Try saving again or re-uploading.
      </p>
    );
  }

  return <p className="text-xs text-parchment-muted/80">Loading audio…</p>;
}
