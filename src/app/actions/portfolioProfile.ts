"use server";

import { revalidatePath } from "next/cache";
import {
  createPortfolioProfile,
  deletePortfolioProfile,
  ensurePrimaryPortfolioProfile,
  getPortfolioProfiles,
  getUserPlan,
  updatePortfolioProfile,
} from "@/lib/db/portfolio";
import { getLimit } from "@/lib/planGate";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AccountKind, DbPortfolioProfile, PortfolioKind } from "@/types/database";

async function getAuthedUser() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null };
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function canAddPortfolio(
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthedUser>>["supabase"]>,
  ownerUserId: string,
): Promise<{ allowed: boolean; error: string | null }> {
  const [plan, portfolios] = await Promise.all([
    getUserPlan(supabase, ownerUserId),
    getPortfolioProfiles(supabase, ownerUserId),
  ]);
  const limit = getLimit(plan, "maxPortfolioProfiles");
  if (plan === "free" && portfolios.length >= limit) {
    return { allowed: false, error: "Free portfolio limit reached." };
  }
  return { allowed: true, error: null };
}

export async function createPortfolioProfileAction(fields: {
  display_name: string;
  portfolio_kind: PortfolioKind;
  grade?: number | null;
  birth_year?: number | null;
}): Promise<{ data: DbPortfolioProfile | null; error: string | null }> {
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { data: null, error: "Not signed in." };
  if (!fields.display_name?.trim()) return { data: null, error: "Name is required." };

  const gate = await canAddPortfolio(supabase, user.id);
  if (!gate.allowed) return { data: null, error: gate.error };

  const result = await createPortfolioProfile(supabase, user.id, fields);
  if (!result.error) {
    revalidatePath("/portfolios");
  }
  return result;
}

/** @deprecated Use createPortfolioProfileAction */
export async function createChildProfileAction(fields: {
  display_name: string;
  grade?: number | null;
  birth_year?: number | null;
}): Promise<{ data: DbPortfolioProfile | null; error: string | null }> {
  return createPortfolioProfileAction({ ...fields, portfolio_kind: "child" });
}

export async function updatePortfolioProfileAction(
  portfolioId: string,
  patch: Partial<
    Pick<DbPortfolioProfile, "display_name" | "grade" | "birth_year" | "photo_url">
  >,
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { error: "Not signed in." };

  const result = await updatePortfolioProfile(supabase, user.id, portfolioId, patch);
  if (!result.error) {
    revalidatePath("/portfolios");
    revalidatePath(`/portfolios/${portfolioId}`);
  }
  return result;
}

/** @deprecated Use updatePortfolioProfileAction */
export async function updateChildProfileAction(
  childId: string,
  patch: Partial<
    Pick<DbPortfolioProfile, "display_name" | "grade" | "birth_year" | "photo_url">
  >,
): Promise<{ error: string | null }> {
  return updatePortfolioProfileAction(childId, patch);
}

export async function deletePortfolioProfileAction(
  portfolioId: string,
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { error: "Not signed in." };

  const result = await deletePortfolioProfile(supabase, user.id, portfolioId);
  if (!result.error) {
    revalidatePath("/portfolios");
  }
  return result;
}

/** @deprecated Use deletePortfolioProfileAction */
export async function deleteChildProfileAction(
  childId: string,
): Promise<{ error: string | null }> {
  return deletePortfolioProfileAction(childId);
}

export async function ensureSelfPrimaryPortfolioAction(
  accountKind: AccountKind,
  displayName?: string,
): Promise<{ error: string | null }> {
  if (accountKind !== "self") return { error: null };
  const { supabase, user } = await getAuthedUser();
  if (!supabase || !user) return { error: "Not signed in." };
  try {
    await ensurePrimaryPortfolioProfile(supabase, user.id, displayName);
    revalidatePath("/portfolios");
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create portfolio.",
    };
  }
}
