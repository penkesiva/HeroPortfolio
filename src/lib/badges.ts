import type { YearBlock } from "@/data/timeline";

export type Badge = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
};

export function computeBadges(timeline: YearBlock[]): Badge[] {
  const allEvents = timeline.flatMap((b) => b.achievements);
  const totalEvents = allEvents.length;
  const years = timeline.filter((b) => b.achievements.length > 0).map((b) => b.year);
  const uniqueYears = new Set(years);

  // Count unique categories
  const allCategories = new Set(
    allEvents.flatMap((a) => a.categories ?? []),
  );

  // Check for multi-year streaks
  const sortedYears = [...uniqueYears].sort((a, b) => a - b);
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedYears.length; i++) {
    if (sortedYears[i]! - sortedYears[i - 1]! === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  // Max events in a single year
  const maxEventsInYear = Math.max(...timeline.map((b) => b.achievements.length), 0);

  // Has video events
  const hasVideoEvents = allEvents.some((a) => a.videoUrl?.trim());
  // Has link events
  const hasExternalLinks = allEvents.some((a) => a.links && a.links.length > 0);

  return [
    {
      id: "first_achievement",
      emoji: "🌟",
      name: "First Achievement",
      description: "Logged your very first achievement.",
      earned: totalEvents >= 1,
    },
    {
      id: "five_events",
      emoji: "🔥",
      name: "On a Roll",
      description: "Logged 5 achievements.",
      earned: totalEvents >= 5,
    },
    {
      id: "ten_events",
      emoji: "💪",
      name: "Achievement Hunter",
      description: "Logged 10 achievements across your timeline.",
      earned: totalEvents >= 10,
    },
    {
      id: "twenty_five_events",
      emoji: "🏆",
      name: "Portfolio Champion",
      description: "Logged 25 achievements — that's a serious portfolio!",
      earned: totalEvents >= 25,
    },
    {
      id: "two_year_streak",
      emoji: "📅",
      name: "Consistent",
      description: "Logged achievements in 2 consecutive years.",
      earned: maxStreak >= 2,
    },
    {
      id: "three_year_streak",
      emoji: "🗓️",
      name: "3-Year Streak",
      description: "Logged achievements in 3 consecutive years.",
      earned: maxStreak >= 3,
    },
    {
      id: "multi_talent",
      emoji: "🎨",
      name: "Multi-Talent",
      description: "Achievements in 5 or more different categories.",
      earned: allCategories.size >= 5,
    },
    {
      id: "star_performer",
      emoji: "⭐",
      name: "Star Performer",
      description: "10 or more achievements in a single year.",
      earned: maxEventsInYear >= 10,
    },
    {
      id: "video_star",
      emoji: "🎬",
      name: "Video Star",
      description: "Added a video to an achievement.",
      earned: hasVideoEvents,
    },
    {
      id: "well_connected",
      emoji: "🔗",
      name: "Well Connected",
      description: "Added external links to your achievements.",
      earned: hasExternalLinks,
    },
  ];
}

export function earnedBadges(timeline: YearBlock[]): Badge[] {
  return computeBadges(timeline).filter((b) => b.earned);
}
