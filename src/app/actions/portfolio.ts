"use server";

import { redirect } from "next/navigation";
import type { SiteIntro, YearBlock } from "@/data/timeline";
import {
  saveUserTimeline,
  syncEventImagesForTimeline,
  upsertProfile,
  deleteYearBlock,
  getProfile,
  getUserTimeline,
} from "@/lib/db/portfolio";
import { newlyUnlockedCategoryBadges } from "@/lib/badges";
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

export async function saveTimelineAction(
  yearBlocks: YearBlock[],
): Promise<SaveTimelineResult> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  const timelineBeforeSave = await getUserTimeline(supabase, user.id);

  const saved = await saveUserTimeline(supabase, user.id, yearBlocks);
  if (saved.error) return saved;
  const synced = await syncEventImagesForTimeline(supabase, user.id, yearBlocks);
  if (synced.error) return synced;

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

  const newCategories = [
    ...new Set(freshUnlocks.map((b) => b.category)),
  ];
  const mergedCategories = [
    ...new Set([...alreadyCelebrated, ...newCategories]),
  ];

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

  const celebrationUnlocks: CelebrationUnlockBadge[] = freshUnlocks.map(
    (b) => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      category: b.category,
    }),
  );

  return {
    error: null,
    celebrateFirstContribution: true,
    celebrationDisplayName,
    celebrationUnlocks,
  };
}

export async function saveProfileAction(
  intro: Pick<SiteIntro, "heroLead" | "role" | "bio" | "photoSrc" | "name">,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  // Treat the default placeholder as "no photo set" so the DB stays clean
  const photoUrl =
    intro.photoSrc && intro.photoSrc !== "/avatar-placeholder.svg"
      ? intro.photoSrc
      : null;

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
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  return deleteYearBlock(supabase, user.id, year);
}
