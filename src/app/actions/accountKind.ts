"use server";

import { revalidatePath } from "next/cache";
import type { AccountKind } from "@/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function setAccountKindAction(
  kind: AccountKind,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };
  if (kind !== "self" && kind !== "guardian") {
    return { error: "Invalid choice." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in" };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      account_kind: kind,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .is("account_kind", null)
    .select("id");

  if (error) return { error: error.message };
  if (!data?.length) {
    return { error: "This choice was already saved. Refresh the page." };
  }

  revalidatePath("/timeline");
  revalidatePath("/onboarding/who");
  return { error: null };
}
