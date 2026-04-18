export type Plan = "free" | "pro";

export type DbProfile = {
  id: string;
  display_name: string | null;
  hero_lead: string | null;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ai_uses_this_month: number;
  ai_uses_reset_at: string;
  created_at: string;
  updated_at: string;
};

export type DbYearBlock = {
  id: string;
  user_id: string;
  year: number;
  tagline: string;
  created_at: string;
  updated_at: string;
};

export type DbEvent = {
  id: string;
  year_block_id: string;
  user_id: string;
  heading1: string;
  heading2: string | null;
  heading3: string | null;
  body: string | null;
  categories: string[];
  video_url: string | null;
  music_url: string | null;
  links: Array<{ label: string; href: string }>;
  position: number;
  created_at: string;
  updated_at: string;
};

export type DbEventImage = {
  id: string;
  event_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  position: number;
  created_at: string;
};

export type DbProfileView = {
  id: string;
  portfolio_user_id: string;
  viewer_ip_hash: string;
  referrer: string | null;
  viewed_at: string;
};

/** Full event row joined with its images (storage paths) */
export type DbEventWithImages = DbEvent & {
  event_images: DbEventImage[];
};

/** Full year block joined with its events and their images */
export type DbYearBlockWithEvents = DbYearBlock & {
  events: DbEventWithImages[];
};

export type AnalyticsSummary = {
  totalViews: number;
  viewsThisMonth: number;
  viewsThisWeek: number;
};
