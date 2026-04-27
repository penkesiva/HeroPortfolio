import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key. Bypasses RLS.
 * Use only in trusted server routes (e.g. Stripe webhooks) — never expose the key to the client.
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
