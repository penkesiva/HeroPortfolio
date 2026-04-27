"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MusicNoteGlyph } from "@/components/icons/MusicNoteGlyph";
import { isDirectPlayableAudioUrl, musicUrlToEmbedSrc } from "@/lib/embedUrls";
import { BUCKET_EVENT_IMAGES } from "@/lib/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  title: string;
  musicUrl: string;
};

/** Layout + motion vars for each floating glyph (theme via `text-umber-*`). */
const FLOATING_NOTE_STYLES: CSSProperties[] = [
  {
    top: "8%",
    left: "6%",
    animationDelay: "0s",
    ["--note-dx" as string]: "12px",
    ["--note-dy" as string]: "-18px",
    ["--note-rot" as string]: "-10deg",
    ["--note-rot2" as string]: "14deg",
  },
  {
    top: "14%",
    right: "8%",
    animationDelay: "0.45s",
    ["--note-dx" as string]: "-14px",
    ["--note-dy" as string]: "-12px",
    ["--note-rot" as string]: "6deg",
    ["--note-rot2" as string]: "-12deg",
  },
  {
    top: "42%",
    left: "4%",
    animationDelay: "0.9s",
    ["--note-dx" as string]: "8px",
    ["--note-dy" as string]: "10px",
    ["--note-rot" as string]: "-14deg",
    ["--note-rot2" as string]: "8deg",
  },
  {
    top: "52%",
    right: "6%",
    animationDelay: "1.2s",
    ["--note-dx" as string]: "-10px",
    ["--note-dy" as string]: "-20px",
    ["--note-rot" as string]: "4deg",
    ["--note-rot2" as string]: "16deg",
  },
  {
    bottom: "18%",
    left: "12%",
    animationDelay: "1.55s",
    ["--note-dx" as string]: "16px",
    ["--note-dy" as string]: "8px",
    ["--note-rot" as string]: "-6deg",
    ["--note-rot2" as string]: "-10deg",
  },
  {
    bottom: "12%",
    right: "10%",
    animationDelay: "1.85s",
    ["--note-dx" as string]: "-8px",
    ["--note-dy" as string]: "14px",
    ["--note-rot" as string]: "12deg",
    ["--note-rot2" as string]: "-8deg",
  },
];

function PlayableAudioWithFloatingNotes({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

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

  return (
    <div
      className={`event-music-float-wrap rounded-xl border border-dusk-700/80 bg-dusk-850/80 p-3 ${
        playing ? "event-music-float-wrap--playing" : ""
      }`}
    >
      <div className="event-music-notes" aria-hidden>
        {FLOATING_NOTE_STYLES.map((style, i) => (
          <span
            key={i}
            className="event-music-note text-umber-300/45"
            style={style}
          >
            <MusicNoteGlyph className="size-4 sm:size-5" />
          </span>
        ))}
      </div>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={src}
        className="w-full"
        title={title}
      >
        <a
          href={src}
          className="text-sm text-umber-300 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download audio
        </a>
      </audio>
    </div>
  );
}

/**
 * Renders event music: Spotify/SoundCloud embed, signed storage path, or direct / external link.
 * Raw `userId/.../audio-*.mp3` paths must be signed — they are not valid browser URLs alone.
 */
export function EventMusicPlayer({ title, musicUrl }: Props) {
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
    return <PlayableAudioWithFloatingNotes src={trimmed} title={title} />;
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

  return <SignedStorageAudio path={trimmed} title={title} />;
}

function SignedStorageAudio({ path, title }: { path: string; title: string }) {
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
    return <PlayableAudioWithFloatingNotes src={playSrc} title={title} />;
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
