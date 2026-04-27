"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isDirectPlayableAudioUrl, musicUrlToEmbedSrc } from "@/lib/embedUrls";
import { BUCKET_EVENT_IMAGES } from "@/lib/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  title: string;
  musicUrl: string;
};

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
    return (
      <div className="rounded-xl border border-dusk-700/80 bg-dusk-850/80 p-3">
        <audio controls preload="metadata" src={trimmed} className="w-full">
          <a
            href={trimmed}
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

  return <SignedStorageAudio path={trimmed} />;
}

function SignedStorageAudio({ path }: { path: string }) {
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
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
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
      <div className="rounded-xl border border-dusk-700/80 bg-dusk-850/80 p-3">
        <audio controls preload="metadata" src={playSrc} className="w-full">
          <a
            href={playSrc}
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

  if (error) {
    return (
      <p className="text-xs text-parchment-muted">
        Could not load this audio file. Try saving again or re-uploading.
      </p>
    );
  }

  return <p className="text-xs text-parchment-muted/80">Loading audio…</p>;
}
