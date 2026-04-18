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

  // Strip year blocks that have no real events so empty shells never reach the DB.
  const blocksToPersist = yearBlocks.filter((b) => b.achievements.length > 0);

  return saveUserTimeline(supabase, user.id, blocksToPersist);
}

export async function saveProfileAction(
  intro: Pick<SiteIntro, "heroLead" | "role" | "bio" | "photoSrc">,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/timeline");

  await upsertProfile(supabase, user.id, {
    hero_lead: intro.heroLead ?? null,
    role: intro.role,
    bio: intro.bio,
    photo_url: intro.photoSrc,
  });

  return { error: null };
}
