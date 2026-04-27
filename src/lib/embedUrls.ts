/** Returns an https embed URL for video iframe, or null. */
export function videoUrlToEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        return `${u.origin}${u.pathname}${u.search}`;
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id
          ? `https://www.youtube.com/embed/${encodeURIComponent(id)}`
          : null;
      }
      const v = u.searchParams.get("v");
      return v
        ? `https://www.youtube.com/embed/${encodeURIComponent(v)}`
        : null;
    }

    if (host === "vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[0];
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }

    if (host === "player.vimeo.com" && u.pathname.startsWith("/video/")) {
      return `${u.origin}${u.pathname}${u.search}`;
    }

    return null;
  } catch {
    return null;
  }
}

export function withVideoAutoplay(embedSrc: string): string {
  try {
    const u = new URL(embedSrc);
    u.searchParams.set("autoplay", "1");
    return u.toString();
  } catch {
    const join = embedSrc.includes("?") ? "&" : "?";
    return `${embedSrc}${join}autoplay=1`;
  }
}

/** Spotify / SoundCloud iframe src; null if not embeddable (use external link). */
export function musicUrlToEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "open.spotify.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const [kind, id] = parts;
        const allowed = new Set([
          "track",
          "album",
          "playlist",
          "episode",
          "show",
        ]);
        if (allowed.has(kind) && id) {
          return `https://open.spotify.com/embed/${kind}/${encodeURIComponent(id)}${u.search}`;
        }
      }
      return null;
    }

    if (host === "soundcloud.com") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23b8926a&auto_play=false&hide_related=true&show_comments=false`;
    }

    return null;
  } catch {
    return null;
  }
}

/** True when the URL should play in a native <audio> element (uploaded file or signed storage URL). */
export function isDirectPlayableAudioUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (musicUrlToEmbedSrc(t)) return false;
  const lower = t.toLowerCase();
  if (lower.includes(".supabase.co/storage/")) return true;
  return /\.(mp3|wav|m4a|aac|ogg|opus|flac|webm)(\?|#|$)/i.test(lower);
}
