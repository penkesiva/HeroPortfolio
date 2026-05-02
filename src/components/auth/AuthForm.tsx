"use client";

import Link from "next/link";
import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";
type Method = null | "google" | "email";

function authCallbackWithNext(origin: string, nextPath: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-parchment-muted" aria-hidden>
      <path d="M3 4a2 2 0 0 0-2 2v.217l9 5.25 9-5.25V6a2 2 0 0 0-2-2H3Z" />
      <path d="m1 8.51 8.57 5a2 2 0 0 0 1.86 0L20 8.51V14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8.51Z" />
    </svg>
  );
}

export function AuthForm({ mode, redirectAfterAuth }: { mode: Mode; redirectAfterAuth: string }) {
  const [method, setMethod] = useState<Method>(mode === "signup" ? "email" : null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const [oauthLoading, setOauthLoading] = useState(false);
  const configured = isSupabaseConfigured();
  const nextQuery = `?next=${encodeURIComponent(redirectAfterAuth)}`;

  const callbackUrl = () =>
    typeof window !== "undefined"
      ? authCallbackWithNext(window.location.origin, redirectAfterAuth)
      : "";

  function selectMethod(m: Method) {
    setMethod((prev) => (prev === m ? null : m));
    setPwMessage(null);
  }

  async function onGoogle() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setPwStatus("error"); setPwMessage("Supabase is not configured."); return; }
    setPwMessage(null);
    setOauthLoading(true);
    const redirectTo = callbackUrl();
    if (!redirectTo) {
      setOauthLoading(false);
      setPwStatus("error");
      setPwMessage("Could not build sign-in redirect URL.");
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Google needs these scopes so Supabase can read email + profile on first sign-in
        scopes: "email profile openid",
      },
    });
    if (error) {
      setOauthLoading(false);
      setPwStatus("error");
      setPwMessage(
        error.message.includes("not enabled") || error.message.includes("Unsupported provider")
          ? "Google sign-in is not enabled for this project yet. In Supabase: Authentication → Providers → Google, add your OAuth client ID and secret."
          : error.message,
      );
      return;
    }
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setOauthLoading(false);
    setPwStatus("error");
    setPwMessage("Could not start Google sign-in.");
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (mode === "signup") {
      if (!firstName.trim()) { setPwStatus("error"); setPwMessage("Enter your first name."); return; }
      if (!lastName.trim()) { setPwStatus("error"); setPwMessage("Enter your last name."); return; }
    }
    if (!email.trim()) { setPwStatus("error"); setPwMessage("Enter your email address."); return; }
    if (password.length < 6) { setPwStatus("error"); setPwMessage("Password must be at least 6 characters."); return; }
    if (mode === "signup" && password !== confirm) { setPwStatus("error"); setPwMessage("Passwords do not match."); return; }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setPwStatus("error"); setPwMessage("Supabase is not configured."); return; }
    setPwStatus("loading");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setPwStatus("error"); setPwMessage(error.message); return; }
      window.location.href = redirectAfterAuth;
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });
    if (error) { setPwStatus("error"); setPwMessage(error.message); return; }
    if (data.session) { window.location.href = redirectAfterAuth; return; }

    // No session yet — try signing in immediately (handles edge cases where
    // Supabase requires confirmation even though the setting is off).
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!signInError) { window.location.href = redirectAfterAuth; return; }

    setPwStatus("error");
    setPwMessage("Account created. Try signing in.");
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-dusk-700/80 bg-dusk-900/50 p-6 text-sm text-parchment-muted">
        <p className="font-medium text-parchment">Supabase env missing</p>
        <p className="mt-2">Add <code className="rounded bg-dusk-800 px-1 font-mono text-xs text-umber-300/90">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="rounded bg-dusk-800 px-1 font-mono text-xs text-umber-300/90">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="font-mono text-xs">.env.local</code>.</p>
      </div>
    );
  }

  const btnBase = "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition text-left";
  const btnIdle = "border-dusk-600 bg-dusk-850 text-parchment hover:border-dusk-500 hover:bg-dusk-800";
  const btnActive = "border-umber-500/50 bg-umber-500/12 text-parchment";
  const btnIdleSignup =
    "border-sky-700/60 bg-dusk-850 text-parchment hover:border-sky-600/55 hover:bg-dusk-800";
  const btnActiveSignup = "border-sky-500/55 bg-sky-500/18 text-parchment";
  const isSignup = mode === "signup";
  const googleCta = mode === "login" ? "Sign in with Google" : "Sign up with Google";
  const emailCta = "Email and password";

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-parchment">
        {mode === "login" ? "Log in" : "Create your account"}
      </h1>
      <p className="mt-1.5 text-sm text-parchment-muted/70">
        {mode === "login" ? "Welcome back." : "Free forever. No credit card needed."}
      </p>

      {pwMessage ? (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-center text-xs ${
            pwStatus === "error"
              ? "border-red-500/35 bg-red-950/25 text-red-200/90"
              : "border-dusk-600 bg-dusk-900/60 text-parchment-muted"
          }`}
          role={pwStatus === "error" ? "alert" : "status"}
        >
          {pwMessage}
        </p>
      ) : null}

      <div className="mt-8 space-y-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => { selectMethod("google"); void onGoogle(); }}
          disabled={oauthLoading}
          className={`${btnBase} ${
            method === "google"
              ? isSignup ? btnActiveSignup : btnActive
              : isSignup ? btnIdleSignup : btnIdle
          } disabled:opacity-60`}
        >
          <GoogleIcon className="size-5 shrink-0" />
          <span className="flex-1">{oauthLoading ? "Redirecting…" : googleCta}</span>
        </button>

        {/* Email + password */}
        <div>
          <button
            type="button"
            onClick={() => selectMethod("email")}
            className={`${btnBase} ${
              method === "email"
                ? isSignup ? btnActiveSignup : btnActive
                : isSignup ? btnIdleSignup : btnIdle
            }`}
          >
            <MailIcon />
            <span className="flex-1">{emailCta}</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className={`size-3.5 shrink-0 text-parchment-muted/50 transition-transform duration-200 ${method === "email" ? "rotate-180" : ""}`} aria-hidden>
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {method === "email" && (
            <form
              onSubmit={onPasswordSubmit}
              className="mt-2 space-y-3 rounded-xl border border-dusk-700/60 bg-dusk-900/50 p-4"
            >
              {isSignup && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={pwStatus === "loading"}
                    placeholder="First name"
                    className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/35 disabled:opacity-60"
                  />
                  <input
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={pwStatus === "loading"}
                    placeholder="Last name"
                    className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/35 disabled:opacity-60"
                  />
                </div>
              )}
              <input
                type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={pwStatus === "loading"}
                placeholder="you@example.com"
                className={`w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 disabled:opacity-60 ${
                  isSignup
                    ? "focus:border-sky-600 focus:ring-2 focus:ring-sky-600/35"
                    : "focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/20"
                }`}
              />
              <input
                type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                required value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={pwStatus === "loading"} placeholder="Password (min 6 chars)" minLength={6}
                className={`w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 disabled:opacity-60 ${
                  isSignup
                    ? "focus:border-sky-600 focus:ring-2 focus:ring-sky-600/35"
                    : "focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/20"
                }`}
              />
              {mode === "signup" && (
                <input
                  type="password" autoComplete="new-password" required value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} disabled={pwStatus === "loading"}
                  placeholder="Confirm password" minLength={6}
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/35 disabled:opacity-60"
                />
              )}
              {mode === "login" && (
                <p className="text-right">
                  <Link href="/auth/forgot-password" className="text-xs text-umber-300/80 underline decoration-umber-500/30 underline-offset-2 hover:text-umber-200">
                    Forgot password?
                  </Link>
                </p>
              )}
              <button
                type="submit" disabled={pwStatus === "loading"}
                className={
                  isSignup
                    ? "w-full rounded-lg border border-rose-500/50 bg-rose-600/28 py-2.5 text-sm font-semibold text-rose-50 shadow-[0_0_24px_-8px_rgba(244,63,94,0.35)] transition hover:bg-rose-600/40 disabled:opacity-60"
                    : "w-full rounded-lg border border-umber-500/50 bg-umber-500/20 py-2.5 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30 disabled:opacity-60"
                }
              >
                {pwStatus === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <DotLottieReact src="/animations/sandy_loading.lottie" autoplay loop className="h-5 w-5" />
                    Please wait
                  </span>
                ) : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer links */}
      <p className="mt-8 text-sm text-parchment-muted">
        {mode === "login" ? (
          <>New here?{" "}<Link href={`/signup${nextQuery}`} className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200">Create an account</Link></>
        ) : (
          <>Already have an account?{" "}<Link href={`/login${nextQuery}`} className="signup-footer-link font-medium underline underline-offset-2">Log in</Link></>
        )}
      </p>
    </div>
  );
}
