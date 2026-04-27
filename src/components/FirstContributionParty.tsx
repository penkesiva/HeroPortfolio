"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CATEGORY_META,
  computeBadges,
  type BadgeCategory,
} from "@/lib/badges";
import type { YearBlock } from "@/data/timeline";

const CONFETTI_COLORS = ["#f472b6", "#c084fc", "#38bdf8", "#facc15", "#4ade80"];
const PARTICLE_COUNT = 165;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vrot: number;
  color: string;
  life: number;
  maxLife: number;
};

export type CelebrationUnlockLite = {
  id: string;
  name: string;
  icon: string;
  category: string;
};

type Props = {
  displayName: string;
  unlocks: CelebrationUnlockLite[];
  userId: string;
  timeline: YearBlock[];
  onClose: () => void;
};

function playCelebrationChime(): void {
  type WinAudio = Window &
    typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const AC =
    typeof AudioContext !== "undefined"
      ? AudioContext
      : (window as WinAudio).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, now + i * 0.11);
    g.gain.linearRampToValueAtTime(0.11, now + i * 0.11 + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 1.25);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + i * 0.11);
    osc.stop(now + 1.45);
  });
  void ctx.resume().catch(() => {});
}

export function FirstContributionParty({
  displayName,
  unlocks,
  userId,
  timeline,
  onClose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => playCelebrationChime(), 80);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(onClose, 6000);
    return () => window.clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (modalRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [onClose]);

  const initParticles = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w * 0.5;
    const cy = h * 0.52;
    const list: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4;
      const speed = 5 + Math.random() * 12;
      list.push({
        x: cx + (Math.random() - 0.5) * 100,
        y: cy + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed * (0.45 + Math.random() * 0.55),
        vy: -Math.abs(Math.sin(angle)) * speed - 3 - Math.random() * 7,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.32,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        life: 0,
        maxLife: 110 + Math.random() * 85,
      });
    }
    particlesRef.current = list;
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    initParticles();
    let last = performance.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    resize();
    window.addEventListener("resize", resize);

    const step = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const g = 0.16;
      for (const p of particlesRef.current) {
        p.vy += g * (dt / 16);
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.rot += p.vrot * (dt / 16);
        p.life += dt / 16;
        if (p.y > h + 24 || p.x < -50 || p.x > w + 50 || p.life > p.maxLife) {
          p.x = w * 0.5 + (Math.random() - 0.5) * 100;
          p.y = h * 0.48 + (Math.random() - 0.5) * 40;
          p.vx = (Math.random() - 0.5) * 10;
          p.vy = -7 - Math.random() * 11;
          p.life = 0;
          p.maxLife = 95 + Math.random() * 85;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.3, 1 - p.life / p.maxLife);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, initParticles]);

  const allBadges = computeBadges(timeline);
  const primaryUnlock = unlocks[0];
  const heroBadge =
    primaryUnlock != null
      ? allBadges.find((b) => b.id === primaryUnlock.id) ?? null
      : allBadges.find((b) => b.id === "first_achievement") ?? null;
  const categoryLabel =
    primaryUnlock != null
      ? CATEGORY_META[primaryUnlock.category as BadgeCategory]?.label ??
        primaryUnlock.category
      : "Milestone";

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${encodeURIComponent(userId)}`
      : "";

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareHint("Link copied!");
      window.setTimeout(() => setShareHint(null), 2400);
    } catch {
      setShareHint("Could not copy.");
      window.setTimeout(() => setShareHint(null), 2400);
    }
  };

  const tryNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My HeroPortfolio",
          text: "I just logged my first achievement on HeroPortfolio!",
          url: shareUrl,
        });
        return;
      } catch {
        /* dismissed */
      }
    }
    await copyShare();
  };

  const downloadMomentCard = () => {
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 630;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const grd = ctx.createLinearGradient(0, 0, 1200, 630);
    grd.addColorStop(0, "#141018");
    grd.addColorStop(1, "#2a2235");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = "#e8dcc8";
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.fillText("HeroPortfolio", 72, 160);
    ctx.font = "32px system-ui, sans-serif";
    const line =
      displayName.length > 36 ? `${displayName.slice(0, 33)}…` : displayName;
    ctx.fillText(`You're a legend, ${line}!`, 72, 240);
    ctx.fillStyle = "#b8926a";
    ctx.font = "22px system-ui, sans-serif";
    ctx.fillText(
      heroBadge
        ? `Unlocked: ${heroBadge.name}`
        : "New badge category unlocked",
      72,
      300,
    );
    ctx.fillStyle = "#8a7a90";
    ctx.font = "20px system-ui, sans-serif";
    const urlLine = shareUrl.replace(/^https?:\/\//, "");
    ctx.fillText(urlLine, 72, 540);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "heroportfolio-moment.png";
    a.click();
  };

  const firstName =
    displayName.trim().split(/\s+/)[0] || displayName.trim() || "there";

  return (
    <>
      {/* Dims + blurs all page content (timeline, editor rail, chrome) under the celebration */}
      <div
        className="pointer-events-none fixed inset-0 z-[189] bg-dusk-950/40 backdrop-blur-lg"
        aria-hidden
      />
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-[190]"
          aria-hidden
        />
      )}

      <div className="pointer-events-none fixed inset-0 z-[191] flex items-center justify-center p-4">
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="first-contrib-title"
          initial={
            reducedMotion
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.9, y: 12 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 340, damping: 28 }
          }
          className="pointer-events-auto relative max-w-md rounded-2xl border border-dusk-600 bg-dusk-900/96 p-6 shadow-2xl backdrop-blur-md ring-1 ring-umber-500/20"
        >
          {!reducedMotion && (
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
              aria-hidden
            >
              {[12, 28, 55, 72, 88, 40].map((left, i) => (
                <span
                  key={i}
                  className="absolute top-3 h-1.5 w-1.5 rounded-full bg-umber-300/80 animate-pulse"
                  style={{ left: `${left}%`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}

          <h2
            id="first-contrib-title"
            className="relative text-center text-xl font-bold tracking-tight text-parchment sm:text-2xl"
          >
            You&apos;re literally a legend, {firstName}!
          </h2>
          <p className="relative mt-2 text-center text-sm text-parchment-muted">
            {primaryUnlock != null ? (
              <>
                New <span className="font-medium text-umber-200/90">{categoryLabel}</span>{" "}
                badge track — you just opened it up.
              </>
            ) : (
              <>Your timeline just levelled up.</>
            )}
          </p>
          {unlocks.length > 1 ? (
            <p className="relative mt-1 text-center text-[11px] text-parchment-muted/70">
              Also unlocked:{" "}
              {unlocks
                .slice(1)
                .map((u) => u.name)
                .join(" · ")}
            </p>
          ) : null}

          <div className="relative mt-6 flex flex-col items-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              {!reducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-umber-400/25 blur-xl"
                  animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.85, 1.05, 0.85] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <AnimatePresence>
                <motion.div
                  key={heroBadge?.id ?? "badge"}
                  initial={
                    reducedMotion
                      ? { opacity: 1, rotate: 0, scale: 1 }
                      : { opacity: 0, rotate: -540, scale: 0.2 }
                  }
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 14,
                    delay: reducedMotion ? 0 : 0.12,
                  }}
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-dusk-800 to-dusk-900 text-4xl shadow-lg"
                >
                  {heroBadge?.icon ?? primaryUnlock?.icon ?? "🌟"}
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-umber-300/90">
              {heroBadge?.name ?? primaryUnlock?.name ?? "Badge unlocked"}
            </p>
            <p className="mt-0.5 max-w-[240px] text-center text-[11px] text-parchment-muted/80">
              {heroBadge?.description ??
                "Keep logging wins — more badges unlock as you grow your story."}
            </p>
          </div>

          <div className="relative mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={() => playCelebrationChime()}
              className="rounded-full border border-dusk-600 bg-dusk-850 px-4 py-2 text-xs font-medium text-parchment-muted transition hover:border-umber-500/40 hover:text-parchment"
            >
              Play sound again
            </button>
            <button
              type="button"
              onClick={() => void tryNativeShare()}
              className="rounded-full border border-umber-500/45 bg-umber-500/15 px-4 py-2 text-xs font-medium text-umber-200 transition hover:bg-umber-500/25"
            >
              Share your moment
            </button>
            <button
              type="button"
              onClick={downloadMomentCard}
              className="rounded-full border border-dusk-600 bg-dusk-850 px-4 py-2 text-xs font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment"
            >
              Save image card
            </button>
          </div>
          {shareHint ? (
            <p className="relative mt-2 text-center text-[11px] text-green-400/90">
              {shareHint}
            </p>
          ) : null}

          <p className="relative mt-4 text-center text-[10px] text-parchment-muted/50">
            Sound plays when this opens (some browsers may block it until you
            interact — use &quot;Play sound again&quot; if needed). Each badge
            category celebrates once. Closes in ~6s or tap outside.
          </p>
        </motion.div>
      </div>
    </>
  );
}
