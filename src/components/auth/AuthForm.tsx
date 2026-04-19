"use client";

import Link from "next/link";
import { useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";
type Method = null | "google" | "email" | "magic";

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

function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-parchment-muted" aria-hidden>
      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 1 1 2.828 2.828l-3 3a2 2 0 0 1-2.828 0 1 1 0 0 0-1.414 1.414 4 4 0 0 0 5.656 0l3-3a4 4 0 0 0-5.656-5.656l-1.5 1.5a1 1 0 1 0 1.414 1.414l1.5-1.5Zm-5 5a2 2 0 0 1 2.828 0 1 1 0 1 0 1.414-1.414 4 4 0 0 0-5.656 0l-3 3a4 4 0 1 0 5.656 5.656l1.5-1.5a1 1 0 1 0-1.414-1.414l-1.5 1.5a2 2 0 1 1-2.828-2.828l3-3Z" clipRule="evenodd" />
    </svg>
  );
}

export function AuthForm({ mode, redirectAfterAuth }: { mode: Mode; redirectAfterAuth: string }) {
  const [method, setMethod] = useState<Method>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const [magicEmail, setMagicEmail] = useState("");
  const [magicStatus, setMagicStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [magicMessage, setMagicMessage] = useState<string | null>(null);

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
    setMagicMessage(null);
  }

  async function onGoogle() {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setPwStatus("error"); setPwMessage("Supabase is not configured."); return; }
    setOauthLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) { setOauthLoading(false); setPwStatus("error"); setPwMessage(error.message); return; }
    if (data.url) { window.location.href = data.url; }
    else { setOauthLoading(false); setPwStatus("error"); setPwMessage("Could not start Google sign-in."); }
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
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

    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: callbackUrl() } });
    if (error) { setPwStatus("error"); setPwMessage(error.message); return; }
    if (data.session) { window.location.href = redirectAfterAuth; return; }

    const { data: sessionWrap } = await supabase.auth.getSession();
    if (sessionWrap.session) { window.location.href = redirectAfterAuth; return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!signInError) { window.location.href = redirectAfterAuth; return; }

    setPwStatus("error");
    const msg = signInError.message.toLowerCase();
    setPwMessage(
      msg.includes("confirm") || msg.includes("verified") || msg.includes("not confirmed")
        ? "Check your inbox to confirm your email, then sign in."
        : "Account may be created. Check your email, then sign in.",
    );
  }

  async function onMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMagicMessage(null);
    if (!magicEmail.trim()) { setMagicStatus("error"); setMagicMessage("Enter your email address."); return; }
    const supabase = createBrowserSupabaseClient();
    if (!supabase) { setMagicStatus("error"); setMagicMessage("Supabase is not configured."); return; }
    setMagicStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail.trim(),
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: mode === "signup" },
    });
    if (error) { setMagicStatus("error"); setMagicMessage(error.message); return; }
    setMagicStatus("sent");
    setMagicMessage("Check your inbox for a magic link.");
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

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-parchment">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <p className="mt-1.5 text-sm text-parchment-muted/70">
        {mode === "login" ? "Welcome back." : "Free forever. No credit card needed."}
      </p>

      <div className="mt-8 space-y-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => { selectMethod("google"); void onGoogle(); }}
          disabled={oauthLoading}
          className={`${btnBase} ${method === "google" ? btnActive : btnIdle} disabled:opacity-60`}
        >
          <GoogleIcon className="size-5 shrink-0" />
          <span className="flex-1">{oauthLoading ? "Redirecting…" : "Continue with Google"}</span>
        </button>

        {/* Email + password */}
        <div>
          <button
            type="button"
            onClick={() => selectMethod("email")}
            className={`${btnBase} ${method === "email" ? btnActive : btnIdle}`}
          >
            <MailIcon />
            <span className="flex-1">Continue with email</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className={`size-3.5 shrink-0 text-parchment-muted/50 transition-transform duration-200 ${method === "email" ? "rotate-180" : ""}`} aria-hidden>
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {method === "email" && (
            <form onSubmit={onPasswordSubmit} className="mt-2 space-y-3 rounded-xl border border-dusk-700/60 bg-dusk-900/50 p-4">
              <input
                type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={pwStatus === "loading"}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/20 disabled:opacity-60"
              />
              <input
                type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                required value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={pwStatus === "loading"} placeholder="Password (min 6 chars)" minLength={6}
                className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/20 disabled:opacity-60"
              />
              {mode === "signup" && (
                <input
                  type="password" autoComplete="new-password" required value={confirm}
                  onChange={(e) => setConfirm(e.target.value)} disabled={pwStatus === "loading"}
                  placeholder="Confirm password" minLength={6}
                  className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/20 disabled:opacity-60"
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
                className="w-full rounded-lg border border-umber-500/50 bg-umber-500/20 py-2.5 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30 disabled:opacity-60"
              >
                {pwStatus === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <DotLottieReact src="/animations/sandy_loading.lottie" autoplay loop className="h-5 w-5" />
                    Please wait
                  </span>
                ) : mode === "login" ? "Sign in" : "Create account"}
              </button>
              {pwMessage && (
                <p className={`text-center text-xs ${pwStatus === "error" ? "text-red-300/90" : "text-parchment-muted"}`} role={pwStatus === "error" ? "alert" : "status"}>
                  {pwMessage}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Magic link */}
        <div>
          <button
            type="button"
            onClick={() => selectMethod("magic")}
            className={`${btnBase} ${method === "magic" ? btnActive : btnIdle}`}
          >
            <LinkIcon />
            <span className="flex-1">Email me a link</span>
            <svg viewBox="0 0 16 16" fill="currentColor" className={`size-3.5 shrink-0 text-parchment-muted/50 transition-transform duration-200 ${method === "magic" ? "rotate-180" : ""}`} aria-hidden>
              <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {method === "magic" && (
            <form onSubmit={onMagicSubmit} className="mt-2 space-y-3 rounded-xl border border-dusk-700/60 bg-dusk-900/50 p-4">
              <p className="text-xs text-parchment-muted/70">No password needed. We send a one-time link to your inbox.</p>
              <input
                type="email" autoComplete="email" required value={magicEmail}
                onChange={(e) => setMagicEmail(e.target.value)}
                disabled={magicStatus === "loading" || magicStatus === "sent"}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-dusk-600 bg-dusk-850 px-3 py-2.5 text-sm text-parchment outline-none placeholder:text-parchment-muted/40 focus:border-umber-400/50 focus:ring-2 focus:ring-umber-400/20 disabled:opacity-60"
              />
              <button
                type="submit" disabled={magicStatus === "loading" || magicStatus === "sent"}
                className="w-full rounded-lg border border-dusk-500 bg-dusk-850 py-2.5 text-sm font-medium text-parchment transition hover:bg-dusk-800 disabled:opacity-60"
              >
                {magicStatus === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <DotLottieReact src="/animations/sandy_loading.lottie" autoplay loop className="h-5 w-5" />
                    Sending
                  </span>
                ) : magicStatus === "sent" ? "Link sent ✓" : "Send link"}
              </button>
              {magicMessage && (
                <p className={`text-center text-xs ${magicStatus === "error" ? "text-red-300/90" : "text-parchment-muted"}`} role={magicStatus === "error" ? "alert" : "status"}>
                  {magicMessage}
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Footer links */}
      <p className="mt-8 text-sm text-parchment-muted">
        {mode === "login" ? (
          <>New here?{" "}<Link href={`/signup${nextQuery}`} className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200">Create an account</Link></>
        ) : (
          <>Already have an account?{" "}<Link href={`/login${nextQuery}`} className="font-medium text-umber-300 underline decoration-umber-500/40 underline-offset-2 hover:text-umber-200">Log in</Link></>
        )}
      </p>
    </div>
  );
}
