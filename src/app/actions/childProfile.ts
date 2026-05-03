"use server";

import { revalidatePath } from "next/cache";
import {
  createChildProfile,
  deleteChildProfile,
  updateChildProfile,
} from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbChildProfile } from "@/types/database";

async function getAuthedUser() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createChildProfileAction(fields: {
  display_name: string;
  grade?: number | null;
  birth_year?: number | null;
}): Promise<{ data: DbChildProfile | null; error: string | null }> {
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { data: null, error: "Not signed in." };
  if (!fields.display_name?.trim()) return { data: null, error: "Name is required." };

  const result = await createChildProfile(supabase, user.id, fields);
  if (!result.error) {
    revalidatePath("/children");
  }
  return result;
}

export async function updateChildProfileAction(
  childId: string,
  patch: Partial<Pick<DbChildProfile, "display_name" | "grade" | "birth_year" | "photo_url">>,
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { error: "Not signed in." };

  const result = await updateChildProfile(supabase, user.id, childId, patch);
  if (!result.error) {
    revalidatePath("/children");
    revalidatePath(`/children/${childId}`);
  }
  return result;
}

export async function deleteChildProfileAction(
  childId: string,
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { error: "Not signed in." };

  const result = await deleteChildProfile(supabase, user.id, childId);
  if (!result.error) {
    revalidatePath("/children");
  }
  return result;
}
