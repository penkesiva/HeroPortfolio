"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function onSignOut() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      window.location.href = "/";
      return;
    }
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      disabled={loading}
      className="rounded-full border border-dusk-600 bg-dusk-850/80 px-3 py-1.5 text-xs font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
