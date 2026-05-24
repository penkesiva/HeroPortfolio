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
  DbPortfolioProfile,
  DbProfile,
  DbYearBlock,
  Plan,
  PortfolioKind,
  PortfolioVisibility,
} from "@/types/database";
import {
  signEventImagePaths,
  signStoragePath,
  BUCKET_EVENT_IMAGES,
  BUCKET_PROFILE_PHOTOS,
} from "@/lib/storage";
import { DEFAULT_AVATAR_STORED, isDefaultAvatar } from "@/lib/defaultAvatar";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * Private Storage objects are only readable by the owner per RLS. Public pages
 * use an anon (or unscoped) Supabase client, so `createSignedUrl` would fail
 * and images/audio would 404. Use the service role only to sign paths we already
 * loaded from trusted DB rows. Falls back to the session client if no key.
 */
function getClientForStorageSigning(
  userSessionClient: SupabaseClient,
): SupabaseClient {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return userSessionClient;
  }
  try {
    return createServiceSupabaseClient();
  } catch {
    return userSessionClient;
  }
}

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

export async function getPortfolioVisibility(
  supabase: SupabaseClient,
  portfolioUserId: string,
): Promise<PortfolioVisibility> {
  const { data, error } = await supabase.rpc("get_portfolio_visibility", {
    p_portfolio_id: portfolioUserId,
  });
  if (error || !data) return "not_found";
  if (data === "public" || data === "private" || data === "not_found") {
    return data;
  }
  return "not_found";
}

export async function getPublicChildProfile(
  supabase: SupabaseClient,
  childId: string,
): Promise<DbPortfolioProfile | null> {
  const { data } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("id", childId)
    .eq("is_public", true)
    .maybeSingle();
  return (data as DbPortfolioProfile | null) ?? null;
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

  // Batch-sign all storage paths from the private event-images bucket (images + uploaded audio)
  const imagePaths = imageRows.map((img) => img.storage_path);
  const musicPaths = eventRows
    .map((e) => e.music_url)
    .filter(
      (u): u is string =>
        Boolean(u && !u.startsWith("http") && !u.startsWith("data:")),
    );
  const signClient = getClientForStorageSigning(supabase);
  const signedMap = await signEventImagePaths(signClient, [
    ...imagePaths,
    ...musicPaths,
  ]);

  // Replace storage_path with its signed URL for rendering
  const signedImageRows = imageRows.map((img) => ({
    ...img,
    storage_path: signedMap.get(img.storage_path) ?? img.storage_path,
  }));

  const eventsWithSignedMusic = eventRows.map((ev) => {
    const raw = ev.music_url;
    if (!raw || raw.startsWith("http") || raw.startsWith("data:")) {
      return ev;
    }
    return {
      ...ev,
      music_url: signedMap.get(raw) ?? raw,
    };
  });

  return yearBlockRows.map((block) => {
    const blockEvents = eventsWithSignedMusic.filter(
      (e) => e.year_block_id === block.id,
    );
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

    // Drop events removed in the editor (upsert only writes rows still present).
    const { data: existingRows, error: listErr } = await supabase
      .from("events")
      .select("id")
      .eq("year_block_id", yearBlockId)
      .eq("user_id", userId);
    if (listErr) return { error: listErr.message };
    const keepIds = new Set(block.achievements.map((a) => a.id));
    const orphanIds = (existingRows ?? [])
      .map((r) => (r as { id: string }).id)
      .filter((id) => !keepIds.has(id));
    if (orphanIds.length > 0) {
      const { error: delErr } = await supabase
        .from("events")
        .delete()
        .in("id", orphanIds)
        .eq("user_id", userId);
      if (delErr) return { error: delErr.message };
    }
  }

  return { error: null };
}

function orderedAchievementImageSources(a: Achievement): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u: string | undefined) => {
    const t = u?.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  push(a.imageSrc);
  if (a.images) for (const x of a.images) push(x);
  return out;
}

function parseDataImageUrl(
  url: string,
): { bytes: Buffer; contentType: string } | null {
  if (!url.startsWith("data:image")) return null;
  const comma = url.indexOf(",");
  if (comma === -1) return null;
  const header = url.slice(0, comma);
  const mimeMatch = /^data:(image\/[^;]+)/i.exec(header);
  const contentType = mimeMatch?.[1]?.toLowerCase() ?? "image/jpeg";
  const body = url.slice(comma + 1);
  const isBase64 = /;base64/i.test(header);
  try {
    if (isBase64) return { bytes: Buffer.from(body, "base64"), contentType };
    return { bytes: Buffer.from(decodeURIComponent(body), "utf8"), contentType };
  } catch {
    return null;
  }
}

function extForImageContentType(ct: string): string {
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("gif")) return "gif";
  return "jpg";
}

/** Extract bucket path from a Supabase signed (or public) object URL. */
function storagePathFromSupabaseObjectUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("supabase.co")) return null;
    const p = u.pathname;
    const signSeg = "/storage/v1/object/sign/event-images/";
    const i = p.indexOf(signSeg);
    if (i !== -1) return decodeURIComponent(p.slice(i + signSeg.length));
    const pubSeg = "/storage/v1/object/public/event-images/";
    const j = p.indexOf(pubSeg);
    if (j !== -1) return decodeURIComponent(p.slice(j + pubSeg.length));
    return null;
  } catch {
    return null;
  }
}

function isRawEventImageStoragePath(s: string): boolean {
  return (
    !s.startsWith("data:") &&
    !s.startsWith("http") &&
    !s.startsWith("/") &&
    s.includes("/")
  );
}

async function removeExistingEventImages(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
): Promise<void> {
  const { data: rows } = await supabase
    .from("event_images")
    .select("storage_path")
    .eq("event_id", eventId)
    .eq("user_id", userId);
  const paths = (rows ?? [])
    .map((r) => (r as { storage_path: string }).storage_path)
    .filter((p) => p && !p.startsWith("http") && !p.startsWith("data:"));
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET_EVENT_IMAGES).remove(paths);
  }
  await supabase
    .from("event_images")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);
}

/**
 * Persist achievement images to Storage + `event_images` so public timelines
 * (and server renders) can load them. Editor keeps `data:` URLs client-side;
 * `saveUserTimeline` only writes `events` rows — this sync fills the gap.
 */
export async function syncEventImagesForTimeline(
  supabase: SupabaseClient,
  userId: string,
  yearBlocks: YearBlock[],
): Promise<{ error: string | null }> {
  for (const block of yearBlocks) {
    for (const a of block.achievements) {
      const sources = orderedAchievementImageSources(a);
      await removeExistingEventImages(supabase, userId, a.id);

      let position = 0;
      for (const src of sources) {
        let storagePath: string | null = null;

        if (src.startsWith("data:image")) {
          const parsed = parseDataImageUrl(src);
          if (!parsed) {
            return { error: "One image could not be read. Try a smaller JPEG or PNG." };
          }
          const ext = extForImageContentType(parsed.contentType);
          storagePath = `${userId}/${a.id}/${Date.now()}-${position}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET_EVENT_IMAGES)
            .upload(storagePath, parsed.bytes, {
              contentType: parsed.contentType,
              upsert: false,
            });
          if (upErr) return { error: upErr.message };
        } else if ((storagePath = storagePathFromSupabaseObjectUrl(src))) {
          // already in our bucket
        } else if (isRawEventImageStoragePath(src)) {
          storagePath = src;
        } else {
          // e.g. external http URL in image field — skip DB row
          continue;
        }

        const { error: insErr } = await supabase.from("event_images").insert({
          event_id: a.id,
          user_id: userId,
          storage_path: storagePath,
          position: position++,
        });
        if (insErr) return { error: insErr.message };
      }
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
  const rawPhotoUrl = profile?.photo_url ?? DEFAULT_AVATAR_STORED;
  const signClient = getClientForStorageSigning(supabase);
  const photoSrc = await signStoragePath(signClient, BUCKET_PROFILE_PHOTOS, rawPhotoUrl);

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

/**
 * Build a SiteIntro from a child profile (no auth user involved).
 */
export async function childProfileToSiteIntro(
  supabase: SupabaseClient,
  child: DbPortfolioProfile,
): Promise<SiteIntro> {
  const rawPhotoUrl = child.photo_url ?? DEFAULT_AVATAR_STORED;
  const signClient = getClientForStorageSigning(supabase);
  const photoSrc = await signStoragePath(signClient, BUCKET_PROFILE_PHOTOS, rawPhotoUrl);
  const gradeLabel =
    child.portfolio_kind === "child" && child.grade != null
      ? child.grade === 0
        ? "Kindergarten"
        : `Grade ${child.grade}`
      : null;

  return {
    name: child.display_name,
    heroLead: "I'm",
    role: gradeLabel
      ? `${gradeLabel} · Portfolio`
      : child.is_primary
        ? "Student · Portfolio"
        : `${child.display_name} · Portfolio`,
    bio: "Add milestones, media, and links. This timeline tracks achievements year by year.",
    photoSrc,
    photoAlt: child.display_name,
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

import { FREE_AI_USES_PER_MONTH } from "@/lib/constants";

const FREE_AI_LIMIT = FREE_AI_USES_PER_MONTH;
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

// ─── portfolio profiles (children + personal) ────────────────────────────────

export async function getPortfolioProfiles(
  supabase: SupabaseClient,
  ownerUserId: string,
): Promise<DbPortfolioProfile[]> {
  const { data } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("parent_user_id", ownerUserId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  return (data as DbPortfolioProfile[] | null) ?? [];
}

export type PortfolioHubEntry = {
  portfolio: DbPortfolioProfile;
  photoSrc: string | null;
};

/** Hub cards: resolve + sign photos, with account photo fallback for primary portfolio. */
export async function getPortfolioHubEntries(
  supabase: SupabaseClient,
  ownerUserId: string,
): Promise<PortfolioHubEntry[]> {
  const [portfolios, ownerProfile] = await Promise.all([
    getPortfolioProfiles(supabase, ownerUserId),
    getProfile(supabase, ownerUserId),
  ]);
  const signClient = getClientForStorageSigning(supabase);

  return Promise.all(
    portfolios.map(async (portfolio) => {
      const rawPhoto =
        portfolio.photo_url ??
        (portfolio.is_primary && portfolio.portfolio_kind === "personal"
          ? ownerProfile?.photo_url
          : null);

      if (!rawPhoto || isDefaultAvatar(rawPhoto)) {
        return { portfolio, photoSrc: DEFAULT_AVATAR_STORED };
      }

      const photoSrc = await signStoragePath(
        signClient,
        BUCKET_PROFILE_PHOTOS,
        rawPhoto,
      );
      return { portfolio, photoSrc };
    }),
  );
}

/** @deprecated Use getPortfolioProfiles */
export async function getChildProfiles(
  supabase: SupabaseClient,
  parentUserId: string,
): Promise<DbPortfolioProfile[]> {
  return getPortfolioProfiles(supabase, parentUserId);
}

export async function getPortfolioProfile(
  supabase: SupabaseClient,
  ownerUserId: string,
  portfolioId: string,
): Promise<DbPortfolioProfile | null> {
  const { data } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("id", portfolioId)
    .eq("parent_user_id", ownerUserId)
    .single();
  return (data as DbPortfolioProfile | null) ?? null;
}

/** @deprecated Use getPortfolioProfile */
export async function getChildProfile(
  supabase: SupabaseClient,
  parentUserId: string,
  childId: string,
): Promise<DbPortfolioProfile | null> {
  return getPortfolioProfile(supabase, parentUserId, childId);
}

export async function getPrimaryPortfolioProfile(
  supabase: SupabaseClient,
  ownerUserId: string,
): Promise<DbPortfolioProfile | null> {
  const { data } = await supabase
    .from("child_profiles")
    .select("*")
    .eq("parent_user_id", ownerUserId)
    .eq("portfolio_kind", "personal")
    .eq("is_primary", true)
    .maybeSingle();
  return (data as DbPortfolioProfile | null) ?? null;
}

export async function ensurePrimaryPortfolioProfile(
  supabase: SupabaseClient,
  ownerUserId: string,
  displayName = "My Portfolio",
): Promise<DbPortfolioProfile> {
  const existing = await getPrimaryPortfolioProfile(supabase, ownerUserId);
  if (existing) return existing;

  const ownerProfile = await getProfile(supabase, ownerUserId);

  const { data, error } = await supabase
    .from("child_profiles")
    .insert({
      parent_user_id: ownerUserId,
      display_name: displayName.trim() || "My Portfolio",
      portfolio_kind: "personal",
      is_primary: true,
      photo_url: ownerProfile?.photo_url ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create primary portfolio.");
  }

  return data as DbPortfolioProfile;
}

export async function resolveDefaultPortfolioId(
  supabase: SupabaseClient,
  ownerUserId: string,
  accountKind: "self" | "guardian" | null,
): Promise<string | null> {
  if (accountKind === "self") {
    const primary = await ensurePrimaryPortfolioProfile(supabase, ownerUserId);
    return primary.id;
  }
  const profiles = await getPortfolioProfiles(supabase, ownerUserId);
  return profiles[0]?.id ?? null;
}

export async function createPortfolioProfile(
  supabase: SupabaseClient,
  ownerUserId: string,
  fields: {
    display_name: string;
    portfolio_kind: PortfolioKind;
    grade?: number | null;
    birth_year?: number | null;
    is_primary?: boolean;
  },
): Promise<{ data: DbPortfolioProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("child_profiles")
    .insert({
      parent_user_id: ownerUserId,
      display_name: fields.display_name.trim(),
      portfolio_kind: fields.portfolio_kind,
      is_primary: fields.is_primary ?? false,
      grade: fields.portfolio_kind === "child" ? (fields.grade ?? null) : null,
      birth_year:
        fields.portfolio_kind === "child" ? (fields.birth_year ?? null) : null,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as DbPortfolioProfile, error: null };
}

/** @deprecated Use createPortfolioProfile */
export async function createChildProfile(
  supabase: SupabaseClient,
  parentUserId: string,
  fields: { display_name: string; grade?: number | null; birth_year?: number | null },
): Promise<{ data: DbPortfolioProfile | null; error: string | null }> {
  return createPortfolioProfile(supabase, parentUserId, {
    ...fields,
    portfolio_kind: "child",
  });
}

export async function updatePortfolioProfile(
  supabase: SupabaseClient,
  ownerUserId: string,
  portfolioId: string,
  patch: Partial<
    Pick<
      DbPortfolioProfile,
      "display_name" | "grade" | "birth_year" | "photo_url" | "is_public"
    >
  >,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("child_profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", portfolioId)
    .eq("parent_user_id", ownerUserId);
  return { error: error?.message ?? null };
}

/** @deprecated Use updatePortfolioProfile */
export async function updateChildProfile(
  supabase: SupabaseClient,
  parentUserId: string,
  childId: string,
  patch: Partial<
    Pick<DbPortfolioProfile, "display_name" | "grade" | "birth_year" | "photo_url" | "is_public">
  >,
): Promise<{ error: string | null }> {
  return updatePortfolioProfile(supabase, parentUserId, childId, patch);
}

export async function deletePortfolioProfile(
  supabase: SupabaseClient,
  ownerUserId: string,
  portfolioId: string,
): Promise<{ error: string | null }> {
  const profile = await getPortfolioProfile(supabase, ownerUserId, portfolioId);
  if (!profile) return { error: "Portfolio not found." };
  if (profile.is_primary) {
    return { error: "Your main portfolio can't be deleted." };
  }

  const { error } = await supabase
    .from("child_profiles")
    .delete()
    .eq("id", portfolioId)
    .eq("parent_user_id", ownerUserId);
  return { error: error?.message ?? null };
}

/** @deprecated Use deletePortfolioProfile */
export async function deleteChildProfile(
  supabase: SupabaseClient,
  parentUserId: string,
  childId: string,
): Promise<{ error: string | null }> {
  return deletePortfolioProfile(supabase, parentUserId, childId);
}

export async function setPortfolioVisibility(
  supabase: SupabaseClient,
  authUserId: string,
  portfolioUserId: string,
  isPublic: boolean,
): Promise<{ error: string | null }> {
  let targetId = portfolioUserId;
  if (portfolioUserId === authUserId) {
    const primary = await getPrimaryPortfolioProfile(supabase, authUserId);
    if (primary) {
      targetId = primary.id;
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({ is_public: isPublic, updated_at: new Date().toISOString() })
        .eq("id", authUserId);
      return { error: error?.message ?? null };
    }
  }

  const { error } = await supabase
    .from("child_profiles")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", targetId)
    .eq("parent_user_id", authUserId);
  return { error: error?.message ?? null };
}
