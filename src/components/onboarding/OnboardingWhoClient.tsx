"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAccountKindAction } from "@/app/actions/accountKind";
import {
  ONBOARDING_ACCOUNT_KIND_EYEBROW,
  ONBOARDING_ACCOUNT_KIND_GUARDIAN_BODY,
  ONBOARDING_ACCOUNT_KIND_GUARDIAN_TITLE,
  ONBOARDING_ACCOUNT_KIND_HEADLINE,
  ONBOARDING_ACCOUNT_KIND_SELF_BODY,
  ONBOARDING_ACCOUNT_KIND_SELF_TITLE,
  ONBOARDING_ACCOUNT_KIND_SUBHEAD,
} from "@/lib/constants";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";
import type { AccountKind } from "@/types/database";

export function OnboardingWhoClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | AccountKind>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(kind: AccountKind) {
    setError(null);
    setBusy(kind);
    const res = await setAccountKindAction(kind);
    setBusy(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    // Guardians and students land on the unified portfolios hub
    if (kind === "guardian") {
      router.push("/portfolios");
    } else {
      const safe = sanitizeAuthRedirect(nextPath, "/portfolios");
      const dest = safe.startsWith("/onboarding") ? "/portfolios" : safe;
      router.push(dest);
    }
    router.refresh();
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-2xl border-2 border-umber-500/45 bg-gradient-to-b from-umber-500/18 via-dusk-900/95 to-dusk-950 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.5)] ring-2 ring-umber-300/20 sm:p-10">
        <div className="flex justify-center">
          <p className="inline-flex rounded-full border border-umber-400/55 bg-umber-500/25 px-4 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-umber-100 shadow-sm sm:text-xs sm:tracking-[0.2em]">
            {ONBOARDING_ACCOUNT_KIND_EYEBROW}
          </p>
        </div>
        <h1 className="mt-6 text-balance text-center text-3xl font-semibold leading-[1.15] tracking-tight text-parchment sm:text-4xl">
          {ONBOARDING_ACCOUNT_KIND_HEADLINE}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-parchment-muted sm:max-w-2xl sm:text-[17px]">
          {ONBOARDING_ACCOUNT_KIND_SUBHEAD}
        </p>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-500/35 bg-red-950/30 px-4 py-2 text-center text-sm text-red-200/90" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void choose("self")}
            className="flex flex-col rounded-2xl border border-dusk-600 bg-dusk-850/90 p-6 text-left shadow-lg transition hover:border-umber-500/50 hover:bg-dusk-800/90 disabled:cursor-wait disabled:opacity-70 sm:min-h-[220px] sm:p-7"
          >
            <span className="text-lg font-semibold text-parchment">{ONBOARDING_ACCOUNT_KIND_SELF_TITLE}</span>
            <span className="mt-3 flex-1 text-sm leading-relaxed text-parchment-muted">
              {ONBOARDING_ACCOUNT_KIND_SELF_BODY}
            </span>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-umber-300">
              {busy === "self" ? "Saving…" : "Continue →"}
            </span>
          </button>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void choose("guardian")}
            className="flex flex-col rounded-2xl border border-sky-600/40 bg-dusk-850/90 p-6 text-left shadow-lg transition hover:border-sky-500/55 hover:bg-dusk-800/90 disabled:cursor-wait disabled:opacity-70 sm:min-h-[220px] sm:p-7"
          >
            <span className="text-lg font-semibold text-parchment">{ONBOARDING_ACCOUNT_KIND_GUARDIAN_TITLE}</span>
            <span className="mt-3 flex-1 text-sm leading-relaxed text-parchment-muted">
              {ONBOARDING_ACCOUNT_KIND_GUARDIAN_BODY}
            </span>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-sky-300">
              {busy === "guardian" ? "Saving…" : "Continue →"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
