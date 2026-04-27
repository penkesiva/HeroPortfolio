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

/** Gentle side-to-side wobble (px) while rising; closes to 0 for a seamless loop. */
function lateralDriftKeyframes(i: number): number[] {
  const w = (salt: number, amp: number) => (unitNoise(i, salt) * 2 - 1) * amp;
  return [
    0,
    w(1.2, 14),
    w(1.3, 18),
    w(1.4, 12),
    w(1.5, 16),
    w(1.6, 10),
    w(1.7, 8),
    0,
  ];
}

/**
 * Negative y = move up (Framer translate). Start at card bottom, climb, ease back down.
 */
function riseKeyframes(i: number): number[] {
  const peak = -(92 + unitNoise(i, 2.1) * 48);
  return [
    0,
    -8 - unitNoise(i, 2.2) * 8,
    -22 - unitNoise(i, 2.3) * 12,
    -42 - unitNoise(i, 2.4) * 16,
    -62 - unitNoise(i, 2.5) * 18,
    peak * 0.92,
    peak,
    peak * 0.78,
    -38 - unitNoise(i, 2.6) * 14,
    -14 - unitNoise(i, 2.7) * 8,
    0,
  ];
}

function tumbleKeyframes(i: number): number[] {
  const t = (salt: number, amp: number) => (unitNoise(i, salt) * 2 - 1) * amp;
  return [0, t(3.2, 14), t(3.3, 18), t(3.4, 12), t(3.5, 16), t(3.6, 10), 0];
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
  const baseLeft = [11, 26, 41, 56, 71, 86];
  const bottomPct = 4;

  return baseLeft.map((left, i) => {
    const jitter = (unitNoise(i, 50) - 0.5) * 7;
    const leftPct = Math.min(90, Math.max(6, left + jitter));
    return {
      position: { bottom: `${bottomPct}%`, left: `${leftPct}%` },
      delay: i * 0.55 + unitNoise(i, 51) * 0.35,
      x: lateralDriftKeyframes(i),
      y: riseKeyframes(i),
      rotate: tumbleKeyframes(i),
      opacity: [
        0.12,
        0.28,
        0.42,
        0.55 + unitNoise(i, 30) * 0.18,
        0.62 + unitNoise(i, 31) * 0.12,
        0.58,
        0.4,
        0.22,
        0.12,
      ],
      durX: 3.4 + unitNoise(i, 40) * 3.8,
      durY: 5.2 + unitNoise(i, 41) * 4.2,
      durR: 2.8 + unitNoise(i, 42) * 3.4,
      durOpacity: 4.6 + unitNoise(i, 43) * 3.2,
    };
  });
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
                  rotate: 0,
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
              delay: plan.delay * 0.35,
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
