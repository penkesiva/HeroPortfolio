export type Achievement = {
  id: string;
  /** Primary heading (from JSON `heading1` or legacy `title`). */
  title: string;
  heading2?: string;
  heading3?: string;
  /** Optional long copy; falls back to `description` in the UI when set from JSON. */
  body?: string;
  description: string;
  /** Local path under /public or remote URL; omit with no `images` to hide the media block. */
  imageSrc?: string;
  /** When multiple paths exist, cards show a gallery. */
  images?: string[];
  videoUrl?: string;
  /** Spotify / SoundCloud page URL (embedded when supported). */
  musicUrl?: string;
  links?: { label: string; href: string }[];
  /** Lowercase slugs, e.g. `["music", "stem"]`. Used for filters; omit = uncategorized. */
  categories?: string[];
};

export type YearBlock = {
  year: number;
  /** Short intro shown in the timeline / header */
  tagline: string;
  achievements: Achievement[];
};

/** Replace placeholder copy and media paths when you are ready. */
export const timeline: YearBlock[] = [
  {
    year: 2026,
    tagline: "High school — goals in motion (placeholder).",
    achievements: [
      {
        id: "26-1",
        title: "Upcoming competition season",
        description:
          "Placeholder: describe the event, your role, and the outcome you are aiming for. Swap this text after the season.",
        imageSrc: "/placeholder-achievement.svg",
        videoUrl: "https://www.youtube.com/",
        links: [{ label: "Placeholder results link", href: "#" }],
      },
      {
        id: "26-2",
        title: "Leadership / club milestone",
        description:
          "Placeholder: add a sentence about a club, initiative, or community project you lead or contribute to.",
        imageSrc: "/placeholder-achievement.svg",
      },
    ],
  },
  {
    year: 2025,
    tagline: "Placeholder year — academics, arts, or athletics highlights.",
    achievements: [
      {
        id: "25-1",
        title: "Regional recognition (placeholder)",
        description:
          "Replace with your real story: what you prepared, how long you practiced, and what you learned.",
        imageSrc: "/placeholder-achievement.svg",
        categories: ["music", "competition"],
        videoUrl: "https://www.youtube.com/",
        links: [
          { label: "News / program page (placeholder)", href: "#" },
        ],
      },
      {
        id: "25-2",
        title: "STEM or humanities project",
        description:
          "Placeholder: one paragraph on the question you explored and the artifact you shipped (paper, poster, repo).",
        imageSrc: "/placeholder-achievement.svg",
        categories: ["stem"],
      },
    ],
  },
  {
    year: 2024,
    tagline: "Placeholder — bridge year between programs.",
    achievements: [
      {
        id: "24-1",
        title: "Summer intensive / camp",
        description:
          "Placeholder: name the program, dates, and a concrete skill you gained.",
        imageSrc: "/placeholder-achievement.svg",
        videoUrl: "https://www.youtube.com/",
      },
    ],
  },
  {
    year: 2023,
    tagline: "Middle school → early high school transition (sample).",
    achievements: [
      {
        id: "23-1",
        title: "State / district honor roll (placeholder)",
        description:
          "Replace with your award name, level (school / district / state), and what it meant to you.",
        imageSrc: "/placeholder-achievement.svg",
        links: [{ label: "Certificate (PDF placeholder)", href: "#" }],
      },
      {
        id: "23-2",
        title: "Debate, music, or sports podium",
        description:
          "Placeholder: event, placement, and one memorable moment from competition day.",
        imageSrc: "/placeholder-achievement.svg",
        categories: ["music", "debate"],
        videoUrl: "https://www.youtube.com/",
      },
    ],
  },
  {
    year: 2022,
    tagline: "Middle school highlights (placeholder).",
    achievements: [
      {
        id: "22-1",
        title: "First major award",
        description:
          "Placeholder: what you tried, failed at, adjusted, and eventually achieved.",
        imageSrc: "/placeholder-achievement.svg",
      },
      {
        id: "22-2",
        title: "Community service milestone",
        description:
          "Placeholder: hours, organization, and the impact you saw (even if small).",
        imageSrc: "/placeholder-achievement.svg",
        links: [{ label: "Org website (placeholder)", href: "#" }],
      },
    ],
  },
];

export type SiteIntro = {
  name: string;
  /** Shown before the name in the hero (e.g. “I'm”). */
  heroLead?: string;
  role: string;
  bio: string;
  /** Path under `public/` (e.g. `/content/profile.jpg`). */
  photoSrc: string;
  photoAlt?: string;
};

export const siteIntro: SiteIntro = {
  name: "Samarth Iyer",
  heroLead: "I'm",
  role: "Student · Portfolio",
  bio: "I build projects across academics, arts, and competitions — this timeline tracks milestones year by year. Add your story in `public/content/<year>/events.json` or keep defaults in this file.",
  photoSrc: "/placeholder-achievement.svg",
  photoAlt: "Samarth Iyer",
};
