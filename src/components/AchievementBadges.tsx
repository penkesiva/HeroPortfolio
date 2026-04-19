"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { computeBadges, type Badge } from "@/lib/badges";
import type { YearBlock } from "@/data/timeline";

type Props = {
  timeline: YearBlock[];
  showAll?: boolean;
};

export function AchievementBadges({ timeline, showAll = false }: Props) {
  const badges = useMemo(() => computeBadges(timeline), [timeline]);
  const earned = badges.filter((b) => b.earned);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(showAll);

  const displayed = expanded ? badges : badges.filter((b) => b.earned).slice(0, 6);

  if (earned.length === 0 && !showAll) return null;

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {displayed.map((badge) => (
            <BadgeChip
              key={badge.id}
              badge={badge}
              isActive={tooltip === badge.id}
              onToggle={() =>
                setTooltip((t) => (t === badge.id ? null : badge.id))
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (() => {
          const b = badges.find((x) => x.id === tooltip);
          if (!b) return null;
          return (
            <motion.div
              key={tooltip}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 z-20 mb-2 max-w-[220px] rounded-xl border border-dusk-700/80 bg-dusk-900 p-3 shadow-xl"
            >
              <p className="text-xs font-semibold text-parchment">{b.name}</p>
              <p className="mt-0.5 text-[11px] text-parchment-muted">{b.description}</p>
              {!b.earned && (
                <p className="mt-1 text-[11px] text-parchment-muted/60 italic">
                  Not yet earned
                </p>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {badges.filter((b) => b.earned).length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-[11px] text-parchment-muted/70 hover:text-parchment-muted"
        >
          {expanded ? "Show fewer" : `+${badges.filter((b) => b.earned).length - 6} more badges`}
        </button>
      )}
    </div>
  );
}

function BadgeChip({
  badge,
  isActive,
  onToggle,
}: {
  badge: Badge;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: badge.earned ? 1 : 0.35 }}
      onClick={onToggle}
      title={badge.name}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        badge.earned
          ? isActive
            ? "border-umber-500/60 bg-umber-500/20 text-umber-200"
            : "border-dusk-600 bg-dusk-850 text-parchment-muted hover:border-umber-500/40 hover:text-parchment"
          : "border-dusk-700/40 bg-dusk-900/20 text-parchment-muted/40 cursor-default"
      }`}
    >
      <span>{badge.icon}</span>
      <span className="hidden sm:inline">{badge.name}</span>
    </motion.button>
  );
}
