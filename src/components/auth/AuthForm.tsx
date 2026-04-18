"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";

function authCallbackWithNext(origin: string, nextPath: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  redirectAfterAuth,
}: {
  mode: Mode;
  redirectAfterAuth: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const [magicOpen, setMagicOpen] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicStatus, setMagicStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [magicMessage, setMagicMessage] = useState<string | null>(null);

  const [oauthLoading, setOauthLoading] = useState(false);

  const configured = isSupabaseConfigured();

  const nextQuery = `?next=${encodeURIComponent(redirectAfterAuth)}`;

  const callbackUrl = () =>
    typeof window !== "undefined"
      ? authCallbackWithNext(window.location.origin, redirectAfterAuth)
      : "";

  async function onGoogle() {
    setPwMessage(null);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setPwStatus("error");
      setPwMessage("Supabase is not configured.");
      return;
    }
    setOauthLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setOauthLoading(false);
      setPwStatus("error");
      setPwMessage(error.message);
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    } else {
      setOauthLoading(false);
      setPwStatus("error");
      setPwMessage("Could not start Google sign-in.");
    }
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (!email.trim()) {
      setPwStatus("error");
      setPwMessage("Enter your email address.");
      return;
    }
    if (password.length < 6) {
      setPwStatus("error");
      setPwMessage("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && password !== confirm) {
      setPwStatus("error");
      setPwMessage("Passwords do not match.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setPwStatus("error");
      setPwMessage("Supabase is not configured.");
      return;
    }

    setPwStatus("loading");
    const redirectTo = callbackUrl();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setPwStatus("error");
        setPwMessage(error.message);
        return;
      }
      window.location.href = redirectAfterAuth;
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setPwStatus("error");
      setPwMessage(error.message);
      return;
    }
    if (data.session) {
      window.location.href = redirectAfterAuth;
      return;
    }

    // Supabase often omits `session` in the signUp response even when the user
    // is logged in (or when email confirmation is off). Pick up the session from
    // the client, then try an explicit sign-in before showing "check your email".
    const { data: sessionWrap } = await supabase.auth.getSession();
    if (sessionWrap.session) {
      window.location.href = redirectAfterAuth;
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (!signInError) {
      window.location.href = redirectAfterAuth;
      return;
    }

    setPwStatus("error");
    const msg = signInError.message.toLowerCase();
    if (msg.includes("confirm") || msg.includes("verified") || msg.includes("not confirmed")) {
      setPwMessage(
        "Check your inbox to confirm your email. After you confirm, you’ll be able to sign in.",
      );
    } else {
      setPwMessage(
        "Account may be created. Check your email to confirm if required, then sign in.",
      );
    }
  }

  async function onMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMagicMessage(null);
    if (!magicEmail.trim()) {
      setMagicStatus("error");
      setMagicMessage("Enter your email address.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMagicStatus("error");
      setMagicMessage("Supabase is not configured.");
      return;
    }

    setMagicStatus("loading");
    const redirectTo = callbackUrl();

    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail.trim(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: mode === "signup",
      },
    });

    if (error) {
      setMagicStatus("error");
      setMagicMessage(error.message);
      return;
    }

    setMagicStatus("sent");
    setMagicMessage(
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
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-parchment">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-parchment-muted">
        {mode === "login"
          ? "Use Google, email and password, or a magic link."
          : "Sign up with Google, email and password, or a magic link."}
      </p>

      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={() => void onGoogle()}
          disabled={oauthLoading || pwStatus === "loading"}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-dusk-500 bg-dusk-850 py-3 text-sm font-medium text-parchment transition hover:bg-dusk-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <GoogleIcon className="h-5 w-5 text-parchment" />
          {oauthLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-dusk-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wide">
            <span className="bg-dusk-900/80 px-2 text-parchment-muted">
              or with email
            </span>
          </div>
        </div>

        <form onSubmit={onPasswordSubmit} className="space-y-4">
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
              disabled={pwStatus === "loading"}
              className="mt-1.5 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment outline-none transition placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/30 disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
            >
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pwStatus === "loading"}
              className="mt-1.5 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment outline-none transition placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/30 disabled:opacity-60"
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          {mode === "signup" ? (
            <div>
              <label
                htmlFor="auth-confirm"
                className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
              >
                Confirm password
              </label>
              <input
                id="auth-confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={pwStatus === "loading"}
                className="mt-1.5 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment outline-none transition placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/30 disabled:opacity-60"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          ) : null}
          {mode === "login" ? (
            <p className="text-right text-xs">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
              >
                Forgot password?
              </Link>
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pwStatus === "loading"}
            className="w-full rounded-xl border border-umber-500/50 bg-umber-500/20 py-3 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pwStatus === "loading"
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {pwMessage ? (
          <p
            className={`text-center text-sm ${
              pwStatus === "error" ? "text-red-300/90" : "text-parchment-muted"
            }`}
            role={pwStatus === "error" ? "alert" : "status"}
          >
            {pwMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-8 border-t border-dusk-700/80 pt-6">
        <button
          type="button"
          onClick={() => {
            setMagicOpen((o) => !o);
            setMagicStatus("idle");
            setMagicMessage(null);
          }}
          className="w-full text-center text-xs font-medium text-umber-300/90 underline decoration-umber-500/35 underline-offset-2 hover:text-umber-200"
        >
          {magicOpen ? "Hide magic link option" : "Use a magic link instead"}
        </button>

        {magicOpen ? (
          <form onSubmit={onMagicSubmit} className="mt-4 space-y-3">
            <p className="text-center text-xs text-parchment-muted">
              No password — we email you a one-time link.
            </p>
            <input
              type="email"
              autoComplete="email"
              required
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              disabled={magicStatus === "loading" || magicStatus === "sent"}
              className="w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment outline-none focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/30 disabled:opacity-60"
              placeholder="you@example.com"
            />
            <button
              type="submit"
              disabled={magicStatus === "loading" || magicStatus === "sent"}
              className="w-full rounded-xl border border-dusk-500 bg-dusk-850 py-3 text-sm font-medium text-parchment transition hover:bg-dusk-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {magicStatus === "loading"
                ? "Sending…"
                : magicStatus === "sent"
                  ? "Link sent"
                  : mode === "login"
                    ? "Send magic link"
                    : "Send sign-up link"}
            </button>
            {magicMessage ? (
              <p
                className={`text-center text-xs ${
                  magicStatus === "error"
                    ? "text-red-300/90"
                    : "text-parchment-muted"
                }`}
                role={magicStatus === "error" ? "alert" : "status"}
              >
                {magicMessage}
              </p>
            ) : null}
          </form>
        ) : null}
      </div>

      <p className="mt-8 text-sm text-parchment-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link
              href={`/signup${nextQuery}`}
              className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login${nextQuery}`}
              className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
