"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";

export function MagicLinkAuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email address.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus("error");
      setMessage("Supabase is not configured.");
      return;
    }

    setStatus("loading");
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: mode === "signup",
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(
      "Check your inbox for a magic link. You can close this tab after you click it.",
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dusk-700/80 bg-dusk-900/50 p-6 text-sm text-parchment-muted">
        <p className="font-medium text-parchment">Supabase env missing</p>
        <p className="mt-2">
          Add{" "}
          <code className="rounded bg-dusk-800 px-1 font-mono text-xs text-umber-300/90">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-dusk-800 px-1 font-mono text-xs text-umber-300/90">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to <code className="font-mono text-xs">.env.local</code>, then restart{" "}
          <code className="font-mono text-xs">npm run dev</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/60 p-8 shadow-xl backdrop-blur-sm">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
        HeroPortfolio.com
      </p>
      <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-parchment">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <p className="mt-2 text-center text-sm text-parchment-muted">
        {mode === "login"
          ? "We’ll email you a magic link — no password."
          : "Sign up with your email. We’ll send a magic link to verify it."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
          >
            Email
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || status === "sent"}
            className="mt-1.5 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none ring-umber-400/0 transition placeholder:text-parchment-muted/50 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/40 disabled:opacity-60"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || status === "sent"}
          className="w-full rounded-lg border border-umber-500/50 bg-umber-500/20 py-2.5 text-sm font-medium text-umber-200 transition hover:bg-umber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading"
            ? "Sending…"
            : status === "sent"
              ? "Link sent"
              : mode === "login"
                ? "Send magic link"
                : "Send sign-up link"}
        </button>
      </form>

      {message ? (
        <p
          className={`mt-4 text-center text-sm ${
            status === "error" ? "text-red-300/90" : "text-parchment-muted"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm text-parchment-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href="/signup"
              className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
            >
              Log in
            </Link>
          </>
        )}
      </p>

      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-parchment-muted transition hover:text-parchment"
        >
          ← Back to portfolio
        </Link>
      </p>
    </div>
  );
}
