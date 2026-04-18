"use server";

import { redirect } from "next/navigation";
import type { SiteIntro, YearBlock } from "@/data/timeline";
import { saveUserTimeline, upsertProfile } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveTimelineAction(
  yearBlocks: YearBlock[],
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  return saveUserTimeline(supabase, user.id, yearBlocks);
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
