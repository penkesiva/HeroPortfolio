import type { YearBlock } from "@/data/timeline";

export type BadgeCategory =
  | "milestone"
  | "academic"
  | "sports"
  | "arts"
  | "stem"
  | "leadership"
  | "community"
  | "media"
  | "debate";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export type Badge = {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  earned: boolean;
};

/** Category display metadata — label and Tailwind color classes for the ring and UI. */
export const CATEGORY_META: Record<
  BadgeCategory,
  { label: string; ring: string; bg: string; text: string }
> = {
  milestone:  { label: "Milestone",  ring: "#b8926a", bg: "bg-umber-500/15",   text: "text-umber-300"   },
  academic:   { label: "Academic",   ring: "#38bdf8", bg: "bg-sky-500/15",     text: "text-sky-300"     },
  sports:     { label: "Sports",     ring: "#4ade80", bg: "bg-green-500/15",   text: "text-green-300"   },
  arts:       { label: "Arts",       ring: "#c084fc", bg: "bg-purple-500/15",  text: "text-purple-300"  },
  stem:       { label: "STEM",       ring: "#22d3ee", bg: "bg-cyan-500/15",    text: "text-cyan-300"    },
  leadership: { label: "Leadership", ring: "#fb923c", bg: "bg-orange-500/15",  text: "text-orange-300"  },
  community:  { label: "Community",  ring: "#fb7185", bg: "bg-rose-500/15",    text: "text-rose-300"    },
  media:      { label: "Media",      ring: "#818cf8", bg: "bg-indigo-500/15",  text: "text-indigo-300"  },
  debate:     { label: "Debate",     ring: "#facc15", bg: "bg-yellow-500/15",  text: "text-yellow-300"  },
};

export const TIER_META: Record<BadgeTier, { label: string; color: string }> = {
  bronze:   { label: "Bronze",   color: "#cd7f32" },
  silver:   { label: "Silver",   color: "#a8a9ad" },
  gold:     { label: "Gold",     color: "#ffd700" },
  platinum: { label: "Platinum", color: "#e5e4e2" },
};

export function computeBadges(timeline: YearBlock[]): Badge[] {
  const allEvents = timeline.flatMap((b) => b.achievements);
  const totalEvents = allEvents.length;

  const yearsWithEvents = timeline
    .filter((b) => b.achievements.length > 0)
    .map((b) => b.year);
  const uniqueYears = new Set(yearsWithEvents);

  // Consecutive year streak
  const sortedYears = [...uniqueYears].sort((a, b) => a - b);
  let maxStreak = sortedYears.length > 0 ? 1 : 0;
  let currentStreak = sortedYears.length > 0 ? 1 : 0;
  for (let i = 1; i < sortedYears.length; i++) {
    if (sortedYears[i]! - sortedYears[i - 1]! === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const maxEventsInYear = Math.max(...timeline.map((b) => b.achievements.length), 0);
  const allCategories = new Set(allEvents.flatMap((a) => a.categories ?? []));

  // Per-category event counts (loose matching against slug substrings)
  function countBySlug(...slugs: string[]): number {
    return allEvents.filter((a) =>
      (a.categories ?? []).some((c) => slugs.some((s) => c.includes(s))),
    ).length;
  }

  const academicCount  = countBySlug("academic", "honor", "scholar", "grade", "gpa", "test", "exam", "essay");
  const sportsCount    = countBySlug("sport", "athletic", "soccer", "basketball", "football", "swim", "track", "tennis", "volleyball", "baseball", "softball", "lacrosse", "wrestling", "golf", "gymnastics");
  const artsCount      = countBySlug("art", "music", "theater", "theatre", "dance", "film", "photo", "draw", "paint", "sculpture", "choir", "band", "orchestra");
  const stemCount      = countBySlug("stem", "science", "math", "coding", "program", "robot", "engineer", "computer", "tech", "hackathon", "physics", "chemistry", "biology");
  const leadershipCount= countBySlug("leader", "captain", "president", "officer", "council", "club", "delegate");
  const communityCount = countBySlug("community", "volunteer", "service", "social", "charity", "nonprofit", "outreach");
  const debateCount    = countBySlug("debate", "speech", "public speaking", "oratori", "model un", "mock trial");

  const hasVideo = allEvents.some((a) => a.videoUrl?.trim());
  const hasLinks = allEvents.some((a) => (a.links ?? []).length > 0);

  return [
    // ── Milestone ────────────────────────────────────────────────────────────
    {
      id: "first_achievement",
      icon: "🌟",
      name: "First Achievement",
      description: "Logged your very first achievement.",
      category: "milestone",
      tier: "bronze",
      earned: totalEvents >= 1,
    },
    {
      id: "five_events",
      icon: "🔥",
      name: "On a Roll",
      description: "Logged 5 achievements.",
      category: "milestone",
      tier: "bronze",
      earned: totalEvents >= 5,
    },
    {
      id: "ten_events",
      icon: "💪",
      name: "Achievement Hunter",
      description: "Logged 10 achievements across your timeline.",
      category: "milestone",
      tier: "silver",
      earned: totalEvents >= 10,
    },
    {
      id: "twenty_five_events",
      icon: "🏆",
      name: "Portfolio Champion",
      description: "Logged 25 achievements. That is a serious portfolio.",
      category: "milestone",
      tier: "gold",
      earned: totalEvents >= 25,
    },
    {
      id: "fifty_events",
      icon: "👑",
      name: "Legend",
      description: "50 achievements logged. You are an inspiration.",
      category: "milestone",
      tier: "platinum",
      earned: totalEvents >= 50,
    },
    {
      id: "two_year_streak",
      icon: "📅",
      name: "Consistent",
      description: "Logged achievements in 2 consecutive years.",
      category: "milestone",
      tier: "bronze",
      earned: maxStreak >= 2,
    },
    {
      id: "three_year_streak",
      icon: "🗓️",
      name: "3-Year Streak",
      description: "Logged achievements in 3 consecutive years.",
      category: "milestone",
      tier: "silver",
      earned: maxStreak >= 3,
    },
    {
      id: "five_year_streak",
      icon: "🔁",
      name: "5-Year Streak",
      description: "Logged achievements in 5 consecutive years.",
      category: "milestone",
      tier: "gold",
      earned: maxStreak >= 5,
    },
    {
      id: "star_performer",
      icon: "⭐",
      name: "Star Performer",
      description: "10 or more achievements in a single year.",
      category: "milestone",
      tier: "gold",
      earned: maxEventsInYear >= 10,
    },

    // ── Academic ─────────────────────────────────────────────────────────────
    {
      id: "academic_bronze",
      icon: "📚",
      name: "Studious",
      description: "Logged your first academic achievement.",
      category: "academic",
      tier: "bronze",
      earned: academicCount >= 1,
    },
    {
      id: "academic_silver",
      icon: "🎓",
      name: "Scholar",
      description: "Logged 3 academic achievements.",
      category: "academic",
      tier: "silver",
      earned: academicCount >= 3,
    },
    {
      id: "academic_gold",
      icon: "🏅",
      name: "Honor Student",
      description: "Logged 5 or more academic achievements.",
      category: "academic",
      tier: "gold",
      earned: academicCount >= 5,
    },

    // ── Sports ───────────────────────────────────────────────────────────────
    {
      id: "sports_bronze",
      icon: "🏃",
      name: "Athlete",
      description: "Logged your first sports achievement.",
      category: "sports",
      tier: "bronze",
      earned: sportsCount >= 1,
    },
    {
      id: "sports_silver",
      icon: "🥈",
      name: "Varsity",
      description: "Logged 3 sports achievements.",
      category: "sports",
      tier: "silver",
      earned: sportsCount >= 3,
    },
    {
      id: "sports_gold",
      icon: "🥇",
      name: "Champion",
      description: "Logged 5 or more sports achievements.",
      category: "sports",
      tier: "gold",
      earned: sportsCount >= 5,
    },

    // ── Arts ─────────────────────────────────────────────────────────────────
    {
      id: "arts_bronze",
      icon: "🎨",
      name: "Performer",
      description: "Logged your first arts or music achievement.",
      category: "arts",
      tier: "bronze",
      earned: artsCount >= 1,
    },
    {
      id: "arts_silver",
      icon: "🎭",
      name: "Artist",
      description: "Logged 3 arts or music achievements.",
      category: "arts",
      tier: "silver",
      earned: artsCount >= 3,
    },
    {
      id: "arts_gold",
      icon: "🎬",
      name: "Creative Lead",
      description: "Logged 5 or more arts or music achievements.",
      category: "arts",
      tier: "gold",
      earned: artsCount >= 5,
    },

    // ── STEM ─────────────────────────────────────────────────────────────────
    {
      id: "stem_bronze",
      icon: "🔬",
      name: "Builder",
      description: "Logged your first STEM achievement.",
      category: "stem",
      tier: "bronze",
      earned: stemCount >= 1,
    },
    {
      id: "stem_silver",
      icon: "⚙️",
      name: "Engineer",
      description: "Logged 3 STEM achievements.",
      category: "stem",
      tier: "silver",
      earned: stemCount >= 3,
    },
    {
      id: "stem_gold",
      icon: "🚀",
      name: "Innovator",
      description: "Logged 5 or more STEM achievements.",
      category: "stem",
      tier: "gold",
      earned: stemCount >= 5,
    },

    // ── Leadership ───────────────────────────────────────────────────────────
    {
      id: "leadership_bronze",
      icon: "🙋",
      name: "Rising Leader",
      description: "Logged your first leadership achievement.",
      category: "leadership",
      tier: "bronze",
      earned: leadershipCount >= 1,
    },
    {
      id: "leadership_silver",
      icon: "🗣️",
      name: "Team Leader",
      description: "Logged 3 leadership achievements.",
      category: "leadership",
      tier: "silver",
      earned: leadershipCount >= 3,
    },
    {
      id: "leadership_gold",
      icon: "🎯",
      name: "Visionary",
      description: "Logged 5 or more leadership achievements.",
      category: "leadership",
      tier: "gold",
      earned: leadershipCount >= 5,
    },

    // ── Community ────────────────────────────────────────────────────────────
    {
      id: "community_bronze",
      icon: "🤝",
      name: "Community Starter",
      description: "Logged your first community service achievement.",
      category: "community",
      tier: "bronze",
      earned: communityCount >= 1,
    },
    {
      id: "community_silver",
      icon: "💛",
      name: "Servant Leader",
      description: "Logged 3 community service achievements.",
      category: "community",
      tier: "silver",
      earned: communityCount >= 3,
    },
    {
      id: "community_gold",
      icon: "🌍",
      name: "Change Maker",
      description: "Logged 5 or more community service achievements.",
      category: "community",
      tier: "gold",
      earned: communityCount >= 5,
    },

    // ── Debate ───────────────────────────────────────────────────────────────
    {
      id: "debate_bronze",
      icon: "🎤",
      name: "Speaker",
      description: "Logged your first debate or public speaking achievement.",
      category: "debate",
      tier: "bronze",
      earned: debateCount >= 1,
    },
    {
      id: "debate_silver",
      icon: "📢",
      name: "Orator",
      description: "Logged 3 debate or public speaking achievements.",
      category: "debate",
      tier: "silver",
      earned: debateCount >= 3,
    },
    {
      id: "debate_gold",
      icon: "🏛️",
      name: "Champion Debater",
      description: "Logged 5 or more debate or public speaking achievements.",
      category: "debate",
      tier: "gold",
      earned: debateCount >= 5,
    },

    // ── Media ────────────────────────────────────────────────────────────────
    {
      id: "video_star",
      icon: "🎥",
      name: "Video Star",
      description: "Added a video to an achievement.",
      category: "media",
      tier: "bronze",
      earned: hasVideo,
    },
    {
      id: "well_connected",
      icon: "🔗",
      name: "Well Connected",
      description: "Added external links to your achievements.",
      category: "media",
      tier: "bronze",
      earned: hasLinks,
    },
    {
      id: "storyteller",
      icon: "📖",
      name: "Storyteller",
      description: "Added both videos and links to your achievements.",
      category: "media",
      tier: "silver",
      earned: hasVideo && hasLinks,
    },

    // ── Cross-category ───────────────────────────────────────────────────────
    {
      id: "multi_talent",
      icon: "🌈",
      name: "Multi-Talent",
      description: "Achievements across 5 or more different categories.",
      category: "milestone",
      tier: "gold",
      earned: allCategories.size >= 5,
    },
    {
      id: "renaissance",
      icon: "✨",
      name: "Renaissance Student",
      description: "Achievements across 7 or more different categories.",
      category: "milestone",
      tier: "platinum",
      earned: allCategories.size >= 7,
    },
  ];
}

export function earnedBadges(timeline: YearBlock[]): Badge[] {
  return computeBadges(timeline).filter((b) => b.earned);
}
