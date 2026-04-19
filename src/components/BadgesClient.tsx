"use client";

import { useState } from "react";
import type { Badge, BadgeCategory } from "@/lib/badges";
import { CATEGORY_META, TIER_META } from "@/lib/badges";

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

  return (
    <div
      className={`group relative flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-300 ${
        badge.earned
          ? "border-dusk-600/60 bg-dusk-900/60 hover:border-dusk-500/80 hover:bg-dusk-850/80"
          : "border-dusk-700/40 bg-dusk-950/50 opacity-50"
      }`}
    >
      {/* SVG ring */}
      <div className="relative flex items-center justify-center">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className={badge.earned ? "drop-shadow-md" : ""}
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke={badge.earned ? catMeta.ring : "#2a2520"}
            strokeWidth="6"
            strokeOpacity={badge.earned ? 0.15 : 0.6}
            strokeDasharray={badge.earned ? undefined : "6 4"}
          />

          {/* Filled progress ring — only when earned */}
          {badge.earned && (
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke={catMeta.ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
              style={{
                animation: "ring-fill 1s ease-out forwards, ring-rotate 10s linear infinite 1s",
                transformOrigin: "50px 50px",
              }}
            />
          )}

          {/* Glow pulse on ring when earned */}
          {badge.earned && (
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke={catMeta.ring}
              strokeWidth="2"
              strokeOpacity="0.25"
              style={{ animation: "badge-glow-pulse 2.8s ease-in-out infinite" }}
            />
          )}
        </svg>

        {/* Icon in center of ring */}
        <span
          className="absolute text-3xl"
          style={{ filter: badge.earned ? "none" : "grayscale(1)" }}
          aria-hidden
        >
          {badge.icon}
        </span>

        {/* Lock overlay for unearned */}
        {!badge.earned && (
          <span className="absolute text-sm text-parchment-muted/40" aria-hidden>
            🔒
          </span>
        )}
      </div>

      {/* Badge name */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className={`text-sm font-semibold leading-tight ${badge.earned ? "text-parchment" : "text-parchment-muted/50"}`}>
          {badge.name}
        </p>
        <p className={`text-[11px] leading-snug ${badge.earned ? "text-parchment-muted" : "text-parchment-muted/40"}`}>
          {badge.description}
        </p>
      </div>

      {/* Category + tier row */}
      <div className="flex items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${catMeta.bg} ${catMeta.text}`}>
          {catMeta.label}
        </span>
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: tierMeta.color }}
          title={tierMeta.label}
        />
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

export function BadgesClient({ badges }: { badges: Badge[] }) {
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
