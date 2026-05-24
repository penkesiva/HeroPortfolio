"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SiteIntro, YearBlock } from "@/data/timeline";
import {
  saveUserTimeline,
  syncEventImagesForTimeline,
  upsertProfile,
  updateChildProfile,
  deleteYearBlock,
  getProfile,
  getUserTimeline,
  getUserPlan,
} from "@/lib/db/portfolio";
import { newlyUnlockedCategoryBadges } from "@/lib/badges";
import {
  clampTimelineToPlan,
  parsePortfolioImportJson,
} from "@/lib/portfolioImport";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CelebrationUnlockBadge = {
  id: string;
  name: string;
  icon: string;
  category: string;
};

export type SaveTimelineResult = {
  error: string | null;
  celebrateFirstContribution?: boolean;
  celebrationDisplayName?: string | null;
  celebrationUnlocks?: CelebrationUnlockBadge[];
};

/**
 * Verify that `targetUserId` is a child profile owned by `parentUserId`.
 * Returns the child's id on success, null on failure.
 */
async function verifyChildOwnership(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  parentUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("id", targetUserId)
    .eq("parent_user_id", parentUserId)
    .single();
  return Boolean(data);
}

export async function saveTimelineAction(
  yearBlocks: YearBlock[],
  /** For child portfolios: the child's profile id. Server verifies parenthood. */
  targetUserId?: string,
): Promise<SaveTimelineResult> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  // Determine which userId to save under
  let saveUserId = user.id;
  const isChildContext = targetUserId && targetUserId !== user.id;

  if (isChildContext) {
    const ok = await verifyChildOwnership(supabase, user.id, targetUserId);
    if (!ok) return { error: "Access denied." };
    saveUserId = targetUserId;
  }

  const timelineBeforeSave = await getUserTimeline(supabase, saveUserId);

  const saved = await saveUserTimeline(supabase, saveUserId, yearBlocks);
  if (saved.error) return saved;
  const synced = await syncEventImagesForTimeline(supabase, saveUserId, yearBlocks);
  if (synced.error) return synced;

  // Badge celebration only applies to the parent's own account, not children
  if (isChildContext) return { error: null };

  const profile = await getProfile(supabase, user.id);
  if (!profile) return { error: null };

  const categoryUnlocks = newlyUnlockedCategoryBadges(
    timelineBeforeSave,
    yearBlocks,
  );
  if (categoryUnlocks.length === 0) return { error: null };

  const alreadyCelebrated = new Set(
    profile.celebrated_badge_categories ?? [],
  );
  const freshUnlocks = categoryUnlocks.filter(
    (b) => !alreadyCelebrated.has(b.category),
  );
  if (freshUnlocks.length === 0) return { error: null };

  const newCategories = [...new Set(freshUnlocks.map((b) => b.category))];
  const mergedCategories = [...new Set([...alreadyCelebrated, ...newCategories])];

  const { error: persistErr } = await supabase
    .from("profiles")
    .update({
      celebrated_badge_categories: mergedCategories,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (persistErr) return { error: persistErr.message };

  const celebrationDisplayName =
    profile.display_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : null) ||
    (user.email ? user.email.split("@")[0] : null) ||
    "there";

  const celebrationUnlocks: CelebrationUnlockBadge[] = freshUnlocks.map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    category: b.category,
  }));

  return {
    error: null,
    celebrateFirstContribution: true,
    celebrationDisplayName,
    celebrationUnlocks,
  };
}

export async function saveProfileAction(
  intro: Pick<SiteIntro, "heroLead" | "role" | "bio" | "photoSrc" | "name">,
  /** For child portfolios: the child's profile id. Server verifies parenthood. */
  targetUserId?: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  const photoUrl =
    intro.photoSrc && intro.photoSrc !== "/avatar-placeholder.svg"
      ? intro.photoSrc
      : null;

  // Child profile: save display_name + photo_url to child_profiles
  if (targetUserId && targetUserId !== user.id) {
    const ok = await verifyChildOwnership(supabase, user.id, targetUserId);
    if (!ok) return { error: "Access denied." };
    await updateChildProfile(supabase, user.id, targetUserId, {
      display_name: intro.name?.trim() || undefined,
      photo_url: photoUrl ?? undefined,
    });
    return { error: null };
  }

  await upsertProfile(supabase, user.id, {
    display_name: intro.name?.trim() || null,
    hero_lead: intro.heroLead ?? null,
    role: intro.role,
    bio: intro.bio,
    photo_url: photoUrl,
  });

  return { error: null };
}

export async function deleteYearBlockAction(
  year: number,
  /** For child portfolios: the child's profile id. Server verifies parenthood. */
  targetUserId?: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  let saveUserId = user.id;
  if (targetUserId && targetUserId !== user.id) {
    const ok = await verifyChildOwnership(supabase, user.id, targetUserId);
    if (!ok) return { error: "Access denied." };
    saveUserId = targetUserId;
  }

  return deleteYearBlock(supabase, saveUserId, year);
}

export type ImportPortfolioResult = {
  error: string | null;
  timeline?: YearBlock[];
  profile?: Partial<Pick<SiteIntro, "name" | "heroLead" | "role" | "bio" | "photoSrc">>;
  warnings?: string[];
  stats?: { years: number; events: number };
};

export async function importPortfolioJsonAction(
  rawJson: string,
  /** Portfolio owner: auth user id (student) or child profile id. */
  targetUserId?: string,
): Promise<ImportPortfolioResult> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  let saveUserId = user.id;
  const isChildContext = targetUserId && targetUserId !== user.id;

  if (isChildContext) {
    const ok = await verifyChildOwnership(supabase, user.id, targetUserId);
    if (!ok) return { error: "Access denied." };
    saveUserId = targetUserId;
  }

  let parsed;
  try {
    parsed = parsePortfolioImportJson(rawJson);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not read import file.",
    };
  }

  const plan = await getUserPlan(supabase, user.id);
  const { timeline: clamped, warnings: limitWarnings } = clampTimelineToPlan(
    parsed.timeline,
    plan,
  );
  const warnings = [...parsed.warnings, ...limitWarnings];

  const existing = await getUserTimeline(supabase, saveUserId);
  const importYears = new Set(clamped.map((b) => b.year));
  for (const block of existing) {
    if (!importYears.has(block.year)) {
      const deleted = await deleteYearBlock(supabase, saveUserId, block.year);
      if (deleted.error) return { error: deleted.error };
    }
  }

  const saved = await saveUserTimeline(supabase, saveUserId, clamped);
  if (saved.error) return { error: saved.error };

  const synced = await syncEventImagesForTimeline(supabase, saveUserId, clamped);
  if (synced.error) return { error: synced.error };

  if (parsed.profile) {
    const p = parsed.profile;
    const photoUrl =
      p.photoSrc && p.photoSrc !== "/avatar-placeholder.svg" ? p.photoSrc : null;

    if (isChildContext) {
      await updateChildProfile(supabase, user.id, saveUserId, {
        display_name: p.name?.trim() || undefined,
        photo_url: photoUrl ?? undefined,
      });
    } else {
      await upsertProfile(supabase, user.id, {
        display_name: p.name?.trim() || null,
        hero_lead: p.heroLead ?? null,
        role: p.role ?? null,
        bio: p.bio ?? null,
        photo_url: photoUrl,
      });
    }
  }

  revalidatePath("/timeline");
  revalidatePath("/children");
  if (isChildContext) {
    revalidatePath(`/children/${saveUserId}`);
  }

  const eventCount = clamped.reduce((n, b) => n + b.achievements.length, 0);

  return {
    error: null,
    timeline: clamped,
    profile: parsed.profile ?? undefined,
    warnings,
    stats: { years: clamped.length, events: eventCount },
  };
}
