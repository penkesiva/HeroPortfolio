"use client";

import { useState } from "react";
import type { Badge, BadgeCategory } from "@/lib/badges";
import { CATEGORY_META, TIER_META } from "@/lib/badges";

const CONFETTI_COLORS = [
  "#fbbf24", "#f87171", "#34d399", "#60a5fa",
  "#c084fc", "#fb923c", "#f472b6", "#22d3ee",
  "#a3e635", "#38bdf8", "#fb7185", "#fde68a",
];

// Left cannon — shoots up and left/right from bottom-left of badge
const LEFT_CANNON: { tx: string; ty: string; rot: string; delay: string; ribbon: boolean; dur: string }[] = [
  { tx: "-75px", ty: "-95px",  rot: "-240deg", delay: "0ms",  ribbon: true,  dur: "0.9s" },
  { tx: "-50px", ty: "-115px", rot: "300deg",  delay: "35ms", ribbon: false, dur: "1.0s" },
  { tx: "-20px", ty: "-105px", rot: "-200deg", delay: "15ms", ribbon: true,  dur: "0.85s" },
  { tx: "15px",  ty: "-90px",  rot: "260deg",  delay: "55ms", ribbon: false, dur: "0.95s" },
  { tx: "40px",  ty: "-75px",  rot: "-160deg", delay: "25ms", ribbon: true,  dur: "1.05s" },
  { tx: "-90px", ty: "-65px",  rot: "320deg",  delay: "70ms", ribbon: false, dur: "0.9s"  },
  { tx: "-35px", ty: "-125px", rot: "-280deg", delay: "10ms", ribbon: true,  dur: "1.1s"  },
  { tx: "25px",  ty: "-80px",  rot: "180deg",  delay: "45ms", ribbon: false, dur: "0.88s" },
  { tx: "-60px", ty: "-85px",  rot: "-130deg", delay: "60ms", ribbon: true,  dur: "0.95s" },
  { tx: "5px",   ty: "-110px", rot: "220deg",  delay: "30ms", ribbon: false, dur: "1.0s"  },
];

// Right cannon — mirror of left cannon
const RIGHT_CANNON: { tx: string; ty: string; rot: string; delay: string; ribbon: boolean; dur: string }[] = [
  { tx: "75px",  ty: "-95px",  rot: "240deg",  delay: "0ms",  ribbon: true,  dur: "0.9s"  },
  { tx: "50px",  ty: "-115px", rot: "-300deg", delay: "35ms", ribbon: false, dur: "1.0s"  },
  { tx: "20px",  ty: "-105px", rot: "200deg",  delay: "15ms", ribbon: true,  dur: "0.85s" },
  { tx: "-15px", ty: "-90px",  rot: "-260deg", delay: "55ms", ribbon: false, dur: "0.95s" },
  { tx: "-40px", ty: "-75px",  rot: "160deg",  delay: "25ms", ribbon: true,  dur: "1.05s" },
  { tx: "90px",  ty: "-65px",  rot: "-320deg", delay: "70ms", ribbon: false, dur: "0.9s"  },
  { tx: "35px",  ty: "-125px", rot: "280deg",  delay: "10ms", ribbon: true,  dur: "1.1s"  },
  { tx: "-25px", ty: "-80px",  rot: "-180deg", delay: "45ms", ribbon: false, dur: "0.88s" },
  { tx: "60px",  ty: "-85px",  rot: "130deg",  delay: "60ms", ribbon: true,  dur: "0.95s" },
  { tx: "-5px",  ty: "-110px", rot: "-220deg", delay: "30ms", ribbon: false, dur: "1.0s"  },
];

function playConfettiSound() {
  try {
    type AudioCtxConstructor = typeof AudioContext;
    const Ctor: AudioCtxConstructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: AudioCtxConstructor }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    // Two quick tones — initial pop + sparkle tail
    [
      { t: 0,    f0: 520,  f1: 880,  vol: 0.28, dur: 0.3  },
      { t: 0.07, f0: 700,  f1: 1200, vol: 0.18, dur: 0.25 },
      { t: 0.13, f0: 900,  f1: 1500, vol: 0.12, dur: 0.2  },
    ].forEach(({ t, f0, f1, vol, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(f0, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + t + dur * 0.4);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur);
    });
  } catch { /* ignore — audio not available */ }
}

const LOCKED_HINTS = [
  "Keep logging to unlock this.",
  "You are closer than you think.",
  "Every achievement counts.",
  "Log more to reveal this badge.",
  "Your next milestone is waiting.",
  "One step at a time.",
  "Keep going, hero.",
];

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 276.46

const ALL_CATEGORIES: Array<{ id: BadgeCategory | "all"; label: string }> = [
  { id: "all",        label: "All"        },
  { id: "milestone",  label: "Milestone"  },
  { id: "academic",   label: "Academic"   },
  { id: "sports",     label: "Sports"     },
  { id: "arts",       label: "Arts"       },
  { id: "stem",       label: "STEM"       },
  { id: "leadership", label: "Leadership" },
  { id: "community",  label: "Community"  },
  { id: "debate",     label: "Debate"     },
  { id: "media",      label: "Media"      },
];

function BadgeCard({ badge }: { badge: Badge }) {
  const catMeta  = CATEGORY_META[badge.category];
  const tierMeta = TIER_META[badge.tier];
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleMouseEnter() {
    setHovered(true);
    if (!badge.earned) return;
    setConfettiKey((k) => k + 1);
    setShowConfetti(true);
    playConfettiSound();
  }

  function handleMouseLeave() {
    setHovered(false);
    setShowConfetti(false);
  }

  const spinDuration = hovered ? "3s" : "10s";

  // Dome gradient for front face — radial highlight top-left → dark edge
  const frontGradient = badge.earned
    ? `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.32) 0%, ${catMeta.ring}55 30%, #12100e 65%, rgba(0,0,0,0.55) 100%)`
    : `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.06) 0%, #1a1613 60%, rgba(0,0,0,0.6) 100%)`;

  const backGradient = badge.earned
    ? `radial-gradient(circle at 65% 72%, rgba(255,255,255,0.18) 0%, ${catMeta.ring}30 35%, #0c0a08 70%, rgba(0,0,0,0.5) 100%)`
    : `radial-gradient(circle at 65% 72%, rgba(255,255,255,0.04) 0%, #0c0a08 70%)`;

  const rimColor = badge.earned ? catMeta.ring : "#2a2520";

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col items-center gap-3 overflow-visible rounded-2xl border p-5 transition-all duration-300 ${
        badge.earned
          ? "border-dusk-600/60 bg-dusk-900/60 hover:border-dusk-500/80 hover:bg-dusk-850/80"
          : "border-dusk-700/40 bg-dusk-950/50 opacity-50"
      }`}
    >
      {/* Confetti burst on hover */}
      {showConfetti && badge.earned && (
        <div key={confettiKey} className="pointer-events-none absolute inset-0 z-10">
          {/* Left cannon — bottom-left of badge */}
          <div style={{ position: "absolute", left: "26%", top: "68%" }}>
            {LEFT_CANNON.map((p, i) => (
              <span
                key={`l${i}`}
                style={{
                  position: "absolute",
                  width:  p.ribbon ? 4  : 7,
                  height: p.ribbon ? 14 : 7,
                  borderRadius: p.ribbon ? "2px" : "50%",
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  "--tx": p.tx, "--ty": p.ty, "--rot": p.rot,
                  animation: `confetti-float ${p.dur} ease-out ${p.delay} forwards`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          {/* Right cannon — bottom-right of badge */}
          <div style={{ position: "absolute", right: "26%", top: "68%" }}>
            {RIGHT_CANNON.map((p, i) => (
              <span
                key={`r${i}`}
                style={{
                  position: "absolute",
                  width:  p.ribbon ? 4  : 7,
                  height: p.ribbon ? 14 : 7,
                  borderRadius: p.ribbon ? "2px" : "50%",
                  backgroundColor: CONFETTI_COLORS[(i + 5) % CONFETTI_COLORS.length],
                  "--tx": p.tx, "--ty": p.ty, "--rot": p.rot,
                  animation: `confetti-float ${p.dur} ease-out ${p.delay} forwards`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      )}

      {/* Badge + ring assembly */}
      <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>

        {/* Outer category ring (SVG, stays flat) */}
        <svg width="112" height="112" viewBox="0 0 112 112" className="absolute inset-0">
          {/* Track */}
          <circle cx="56" cy="56" r={50} fill="none"
            stroke={badge.earned ? catMeta.ring : "#2a2520"}
            strokeWidth="5"
            strokeOpacity={badge.earned ? 0.18 : 0.5}
            strokeDasharray={badge.earned ? undefined : "6 4"}
          />
          {/* Filled ring */}
          {badge.earned && (
            <circle cx="56" cy="56" r={50} fill="none"
              stroke={catMeta.ring}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={String(2 * Math.PI * 50)}
              strokeDashoffset={String(2 * Math.PI * 50)}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: "ring-fill 1.2s ease-out forwards, ring-rotate 8s linear infinite 1.2s",
              }}
            />
          )}
          {badge.earned && (
            <circle cx="56" cy="56" r={50} fill="none"
              stroke={catMeta.ring} strokeWidth="2" strokeOpacity="0.22"
              style={{ animation: "badge-glow-pulse 2.8s ease-in-out infinite" }}
            />
          )}
        </svg>

        {/* 3D spinning badge disk */}
        <div style={{ perspective: "520px" }}>
          <div
            style={{
              width: 80,
              height: 80,
              position: "relative",
              transformStyle: "preserve-3d",
              animation: badge.earned
                ? `badge-spin-3d ${spinDuration} linear infinite`
                : "none",
              transition: "animation-duration 0.6s ease",
            }}
          >

            {/* ── Front face ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backfaceVisibility: "hidden",
                transform: "translateZ(7px)",
                background: frontGradient,
                boxShadow: badge.earned
                  ? `inset 0 3px 10px rgba(255,255,255,0.28), inset 0 -6px 12px rgba(0,0,0,0.7), 0 0 0 3px ${rimColor}95, 0 8px 24px rgba(0,0,0,0.55)`
                  : `inset 0 2px 6px rgba(255,255,255,0.06), inset 0 -4px 8px rgba(0,0,0,0.5), 0 0 0 2px ${rimColor}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Top arc highlight — dome curvature */}
              <div style={{
                position: "absolute",
                top: 7, left: "18%", right: "18%",
                height: 16,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.22)",
                filter: "blur(5px)",
                pointerEvents: "none",
              }} />
              <span style={{ fontSize: 28, lineHeight: 1, position: "relative", zIndex: 1 }} aria-hidden>
                {badge.icon}
              </span>
              {!badge.earned && (
                <span style={{ fontSize: 11, position: "absolute", bottom: 12, opacity: 0.35 }}>🔒</span>
              )}
            </div>

            {/* ── Back face ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(7px)",
                background: backGradient,
                boxShadow: badge.earned
                  ? `inset 0 3px 10px rgba(255,255,255,0.12), inset 0 -6px 12px rgba(0,0,0,0.6), 0 0 0 3px ${rimColor}75`
                  : `inset 0 2px 6px rgba(255,255,255,0.04), 0 0 0 2px ${rimColor}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: rimColor,
                opacity: badge.earned ? 0.75 : 0.3,
              }}>
                {catMeta.label.slice(0, 3)}
              </span>
            </div>
          </div>
        </div>

        {/* Tier dot — bottom of ring */}
        {badge.earned && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: tierMeta.color,
            boxShadow: `0 0 6px ${tierMeta.color}80`,
            border: "1.5px solid #0c0a08",
          }} />
        )}
      </div>

      {/* Badge name */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className={`text-sm font-semibold leading-tight ${badge.earned ? "text-parchment" : "text-parchment-muted/60"}`}>
          {badge.name}
        </p>
        <p className={`text-[11px] leading-snug ${badge.earned ? "text-parchment-muted" : "text-parchment-muted/40"}`}>
          {badge.earned
            ? badge.description
            : LOCKED_HINTS[Math.abs(badge.id.charCodeAt(0) + badge.id.charCodeAt(badge.id.length - 1)) % LOCKED_HINTS.length]}
        </p>
      </div>

      {/* Category + tier row — tier only shown when earned */}
      <div className="flex items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.earned ? `${catMeta.bg} ${catMeta.text}` : "bg-dusk-800 text-parchment-muted/40"}`}>
          {catMeta.label}
        </span>
        {badge.earned && (
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: tierMeta.color }}
            title={tierMeta.label}
          />
        )}
      </div>

      {/* Earned glow backdrop */}
      {badge.earned && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${catMeta.ring}15, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

export function BadgesClient({ badges, lifetimeRaised }: { badges: Badge[]; lifetimeRaised: number }) {
  const [activeFilter, setActiveFilter] = useState<BadgeCategory | "all">("all");

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount  = badges.length;

  const filtered =
    activeFilter === "all"
      ? badges
      : badges.filter((b) => b.category === activeFilter);

  // Sort: earned first, then by category alphabetically
  const sorted = [...filtered].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return a.category.localeCompare(b.category);
  });

  return (
    <div>
      {/* Summary strip */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-umber-500/20 text-lg">
          🏅
        </div>
        <div>
          <p className="text-base font-semibold text-parchment">
            {earnedCount} of {totalCount} badges earned
          </p>
          <p className="text-xs text-parchment-muted">
            {totalCount - earnedCount} more to unlock. Keep logging achievements.
          </p>
        </div>

        {/* Mini progress bar */}
        <div className="ml-auto hidden w-32 sm:block">
          <div className="h-1.5 overflow-hidden rounded-full bg-dusk-700">
            <div
              className="h-full rounded-full bg-umber-400 transition-all duration-700"
              style={{ width: `${Math.round((earnedCount / totalCount) * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-parchment-muted">
            {Math.round((earnedCount / totalCount) * 100)}%
          </p>
        </div>
      </div>

      {/* Lifetime fundraising stat — shown only when > 0 */}
      {lifetimeRaised > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/8 px-4 py-3">
          <span className="text-2xl">💝</span>
          <div>
            <p className="text-sm font-semibold text-parchment">
              ${lifetimeRaised.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} raised for causes
            </p>
            <p className="text-xs text-parchment-muted/70">
              Your lifetime fundraising total across all events. A powerful story for applications.
            </p>
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeFilter === cat.id;
          const earnedInCat =
            cat.id === "all"
              ? earnedCount
              : badges.filter((b) => b.category === cat.id && b.earned).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFilter(cat.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "border-umber-500/50 bg-umber-500/20 text-umber-200"
                  : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-dusk-500 hover:text-parchment"
              }`}
            >
              {cat.label}
              {earnedInCat > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? "bg-umber-500/30 text-umber-200" : "bg-dusk-700 text-parchment-muted"}`}>
                  {earnedInCat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Badge grid */}
      {sorted.length === 0 ? (
        <p className="py-16 text-center text-sm text-parchment-muted">
          No badges in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sorted.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}

      {/* Tier legend */}
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-dusk-700/60 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-parchment-muted">
          Tiers
        </p>
        {(Object.entries(TIER_META) as Array<[string, { label: string; color: string }]>).map(
          ([, meta]) => (
            <div key={meta.label} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-xs text-parchment-muted">{meta.label}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
