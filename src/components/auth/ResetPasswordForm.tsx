"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Phase = "loading" | "form" | "error" | "done";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phase, setPhase] = useState<Phase>("loading");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setPhase("error");
      setMessage("Supabase is not configured.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setPhase("error");
      setMessage("Supabase is not configured.");
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user || event === "PASSWORD_RECOVERY") {
        setPhase("form");
        return;
      }
      if (event === "INITIAL_SESSION" && !session?.user) {
        setPhase("error");
        setMessage(
          "This reset link is invalid or expired. Request a new one from the login page.",
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }

    setSubmitStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitStatus("idle");
      setMessage(error.message);
      return;
    }
    setSubmitStatus("idle");
    setPhase("done");
    setMessage("Your password was updated. You can continue to the site.");
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dusk-700/80 bg-dusk-900/50 p-6 text-sm text-parchment-muted">
        <p className="font-medium text-parchment">Supabase env missing</p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/60 p-8 text-center shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
          HeroPortfolio.com
        </p>
        <p className="mt-4 text-sm text-parchment-muted">Verifying reset link…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/60 p-8 text-center shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
          HeroPortfolio.com
        </p>
        <h1 className="mt-3 text-xl font-semibold text-parchment">
          Can’t reset password
        </h1>
        <p className="mt-2 text-sm text-parchment-muted">{message}</p>
        <Link
          href="/auth/forgot-password"
          className="mt-6 inline-flex rounded-full border border-umber-500/45 bg-umber-500/15 px-5 py-2.5 text-sm font-medium text-umber-300 transition hover:bg-umber-500/25"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/60 p-8 text-center shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
          HeroPortfolio.com
        </p>
        <h1 className="mt-3 text-xl font-semibold text-parchment">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-parchment-muted">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-umber-500/45 bg-umber-500/15 px-5 py-2.5 text-sm font-medium text-umber-300 transition hover:bg-umber-500/25"
        >
          Go to HeroPortfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/60 p-8 shadow-xl backdrop-blur-sm">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
        HeroPortfolio.com
      </p>
      <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-parchment">
        Choose a new password
      </h1>
      <p className="mt-2 text-center text-sm text-parchment-muted">
        Enter a new password for your account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="new-password"
            className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
          >
            New password
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitStatus === "loading"}
            className="mt-1.5 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/40 disabled:opacity-60"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
          >
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitStatus === "loading"}
            className="mt-1.5 w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/40 disabled:opacity-60"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={submitStatus === "loading"}
          className="w-full rounded-lg border border-umber-500/50 bg-umber-500/20 py-2.5 text-sm font-medium text-umber-200 transition hover:bg-umber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitStatus === "loading" ? "Saving…" : "Update password"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 text-center text-sm text-red-300/90" role="alert">
          {message}
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm">
        <Link
          href="/login?next=%2Ftimeline"
          className="text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
