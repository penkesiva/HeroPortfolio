/**
 * Server-side DB helpers for reading/writing portfolio data.
 * All functions require a Supabase server client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Achievement, SiteIntro, YearBlock } from "@/data/timeline";
import type {
  AnalyticsSummary,
  DbEvent,
  DbEventImage,
  DbProfile,
  DbYearBlock,
  Plan,
} from "@/types/database";
import {
  signEventImagePaths,
  signStoragePath,
  BUCKET_PROFILE_PHOTOS,
} from "@/lib/storage";

// ─── profile ──────────────────────────────────────────────────────────────────

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<DbProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return (data as DbProfile | null) ?? null;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<
    Pick<DbProfile, "display_name" | "hero_lead" | "role" | "bio" | "photo_url">
  >,
): Promise<void> {
  await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string,
): Promise<Plan> {
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();
  return ((data as { plan?: string } | null)?.plan as Plan) ?? "free";
}

// ─── year_blocks + events ─────────────────────────────────────────────────────

export async function getUserTimeline(
  supabase: SupabaseClient,
  userId: string,
): Promise<YearBlock[]> {
  const { data: blocks, error: blocksErr } = await supabase
    .from("year_blocks")
    .select("*")
    .eq("user_id", userId)
    .order("year", { ascending: false });

  if (blocksErr || !blocks || blocks.length === 0) return [];

  const yearBlockRows = blocks as DbYearBlock[];
  const blockIds = yearBlockRows.map((b) => b.id);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("year_block_id", blockIds)
    .eq("user_id", userId)
    .order("position", { ascending: true });

  const eventRows = (events ?? []) as DbEvent[];
  const eventIds = eventRows.map((e) => e.id);

  let imageRows: DbEventImage[] = [];
  if (eventIds.length > 0) {
    const { data: imgs } = await supabase
      .from("event_images")
      .select("*")
      .in("event_id", eventIds)
      .order("position", { ascending: true });
    imageRows = (imgs ?? []) as DbEventImage[];
  }

  // Batch-sign all storage paths from the private event-images bucket
  const allPaths = imageRows.map((img) => img.storage_path);
  const signedMap = await signEventImagePaths(supabase, allPaths);

  // Replace storage_path with its signed URL for rendering
  const signedImageRows = imageRows.map((img) => ({
    ...img,
    storage_path: signedMap.get(img.storage_path) ?? img.storage_path,
  }));

  return yearBlockRows.map((block) => {
    const blockEvents = eventRows.filter((e) => e.year_block_id === block.id);
    return {
      year: block.year,
      tagline: block.tagline,
      achievements: blockEvents.map((ev) =>
        dbEventToAchievement(
          ev,
          signedImageRows.filter((img) => img.event_id === ev.id),
        ),
      ),
    };
  });
}

export function dbEventToAchievement(
  ev: DbEvent,
  images: DbEventImage[],
): Achievement {
  const imagePaths = images
    .sort((a, b) => a.position - b.position)
    .map((img) => img.storage_path);

  return {
    id: ev.id,
    title: ev.heading1,
    heading2: ev.heading2 ?? undefined,
    body: ev.body ?? undefined,
    description: ev.body ?? "",
    imageSrc: imagePaths[0] ?? undefined,
    images: imagePaths.length > 1 ? imagePaths : undefined,
    videoUrl: ev.video_url ?? undefined,
    musicUrl: ev.music_url ?? undefined,
    links: Array.isArray(ev.links) && ev.links.length > 0 ? ev.links : undefined,
    categories: ev.categories.length > 0 ? ev.categories : undefined,
    amountRaised: ev.amount_raised ?? undefined,
  };
}

export function achievementToDbEvent(
  a: Achievement,
  yearBlockId: string,
  userId: string,
  position: number,
): Omit<DbEvent, "created_at" | "updated_at"> {
  return {
    id: a.id,
    year_block_id: yearBlockId,
    user_id: userId,
    heading1: a.title,
    heading2: a.heading2 ?? null,
    heading3: null,
    body: a.body ?? a.description ?? null,
    categories: a.categories ?? [],
    video_url: a.videoUrl ?? null,
    music_url: a.musicUrl ?? null,
    links: a.links ?? [],
    amount_raised: a.amountRaised ?? null,
    position,
  };
}

export async function saveUserTimeline(
  supabase: SupabaseClient,
  userId: string,
  yearBlocks: YearBlock[],
): Promise<{ error: string | null }> {
  for (const block of yearBlocks) {
    // Upsert year block
    const { data: blockData, error: blockErr } = await supabase
      .from("year_blocks")
      .upsert(
        { user_id: userId, year: block.year, tagline: block.tagline },
        { onConflict: "user_id,year" },
      )
      .select("id")
      .single();

    if (blockErr) return { error: blockErr.message };
    const yearBlockId = (blockData as { id: string }).id;

    // Upsert each event
    const eventRows = block.achievements.map((a, i) =>
      achievementToDbEvent(a, yearBlockId, userId, i),
    );

    if (eventRows.length > 0) {
      const { error: evErr } = await supabase
        .from("events")
        .upsert(eventRows, { onConflict: "id" });
      if (evErr) return { error: evErr.message };
    }
  }

  return { error: null };
}

export async function deleteEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", userId);
}

export async function deleteYearBlock(
  supabase: SupabaseClient,
  userId: string,
  year: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("year_blocks")
    .delete()
    .eq("user_id", userId)
    .eq("year", year);
  return { error: error?.message ?? null };
}

// ─── profile intro → SiteIntro ───────────────────────────────────────────────

/**
 * Async version — signs the profile photo URL if it is a private storage path.
 * Use this server-side where a supabase client is available.
 */
export async function dbProfileToSiteIntro(
  supabase: SupabaseClient,
  profile: DbProfile | null,
  fallbackName: string,
): Promise<SiteIntro> {
  const rawPhotoUrl = profile?.photo_url ?? "/avatar-placeholder.svg";
  const photoSrc = await signStoragePath(supabase, BUCKET_PROFILE_PHOTOS, rawPhotoUrl);

  return {
    name: profile?.display_name ?? fallbackName,
    heroLead: profile?.hero_lead ?? "I'm",
    role: profile?.role ?? "Student · Portfolio",
    bio:
      profile?.bio ??
      "Add your milestones, media, and links. This timeline tracks your achievements year by year.",
    photoSrc,
    photoAlt: profile?.display_name ?? fallbackName,
  };
}

// ─── analytics ───────────────────────────────────────────────────────────────

export async function recordProfileView(
  supabase: SupabaseClient,
  portfolioUserId: string,
  viewerIpHash: string,
  referrer?: string,
): Promise<void> {
  await supabase.from("profile_views").insert({
    portfolio_user_id: portfolioUserId,
    viewer_ip_hash: viewerIpHash,
    referrer: referrer ?? null,
  });
}

export async function getAnalyticsSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<AnalyticsSummary> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay(),
  ).toISOString();

  const { count: totalViews } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("portfolio_user_id", userId);

  const { count: viewsThisMonth } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("portfolio_user_id", userId)
    .gte("viewed_at", startOfMonth);

  const { count: viewsThisWeek } = await supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("portfolio_user_id", userId)
    .gte("viewed_at", startOfWeek);

  return {
    totalViews: totalViews ?? 0,
    viewsThisMonth: viewsThisMonth ?? 0,
    viewsThisWeek: viewsThisWeek ?? 0,
  };
}

// ─── AI usage gating ─────────────────────────────────────────────────────────

const FREE_AI_LIMIT = 2;
const PRO_AI_LIMIT = Infinity;

export async function checkAndIncrementAiUsage(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan,
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = plan === "pro" ? PRO_AI_LIMIT : FREE_AI_LIMIT;
  if (limit === Infinity) return { allowed: true, remaining: Infinity };

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_uses_this_month, ai_uses_reset_at")
    .eq("id", userId)
    .single();

  const p = profile as Pick<DbProfile, "ai_uses_this_month" | "ai_uses_reset_at"> | null;

  // Reset counter if we're in a new month
  const resetAt = p?.ai_uses_reset_at ? new Date(p.ai_uses_reset_at) : new Date(0);
  const now = new Date();
  const needsReset =
    resetAt.getFullYear() < now.getFullYear() ||
    resetAt.getMonth() < now.getMonth();

  const currentUses = needsReset ? 0 : (p?.ai_uses_this_month ?? 0);

  if (currentUses >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("profiles")
    .update({
      ai_uses_this_month: currentUses + 1,
      ai_uses_reset_at: needsReset
        ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        : undefined,
    })
    .eq("id", userId);

  return { allowed: true, remaining: limit - currentUses - 1 };
}
