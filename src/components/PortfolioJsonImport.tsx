"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importPortfolioJsonAction } from "@/app/actions/portfolio";
import { AppNoticeDialog } from "@/components/AppNoticeDialog";
import { PortfolioTransferProgress } from "@/components/PortfolioTransferProgress";
import type { SiteIntro, YearBlock } from "@/data/timeline";

type Props = {
  portfolioUserId: string;
  onImported?: (result: {
    timeline: YearBlock[];
    profile: Partial<SiteIntro> | null;
    warnings: string[];
  }) => void;
  compact?: boolean;
};

type SuccessState = {
  years: number;
  events: number;
  warnings: string[];
};

export function PortfolioJsonImport({
  portfolioUserId,
  onImported,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progressTitle, setProgressTitle] = useState("Importing portfolio");
  const [progressDetail, setProgressDetail] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setError("Choose a .json file.");
      return;
    }

    const ok = window.confirm(
      "Import replaces the entire timeline for this portfolio. Export a backup first if you need one. Continue?",
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgressTitle("Importing portfolio");
    setProgressDetail(`Reading ${file.name}…`);

    try {
      const raw = await file.text();
      setProgressDetail("Saving events and profile…");
      const result = await importPortfolioJsonAction(raw, portfolioUserId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.timeline) {
        setProgressDetail("Refreshing your timeline…");
        onImported?.({
          timeline: result.timeline,
          profile: result.profile ?? null,
          warnings: result.warnings ?? [],
        });
        router.refresh();
        setSuccess({
          years: result.stats?.years ?? result.timeline.length,
          events: result.stats?.events ?? 0,
          warnings: result.warnings ?? [],
        });
      }
    } catch {
      setError("Import failed. Try again.");
    } finally {
      setLoading(false);
      setProgressDetail(undefined);
    }
  }

  return (
    <>
      <PortfolioTransferProgress
        open={loading}
        title={progressTitle}
        detail={progressDetail}
      />
      <AppNoticeDialog
        open={success !== null}
        onClose={() => setSuccess(null)}
        variant="success"
        title="Portfolio imported"
        message="Your timeline is live. Review events, add photos, and share when you're ready."
        stats={
          success
            ? [
                { label: "School years", value: success.years },
                { label: "Events", value: success.events },
              ]
            : undefined
        }
        warnings={success?.warnings}
        primaryLabel="View timeline"
      />
      <AppNoticeDialog
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Import didn't finish"
        message={error ?? "Something went wrong. Try again or export a backup first."}
        primaryLabel="Close"
      />
      <div className={compact ? "" : "rounded-lg border border-dusk-600/80 bg-dusk-850/50 px-3 py-2.5"}>
        {!compact && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-parchment-muted/70">
            Import from JSON
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onFileChange(e)}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className={`rounded-full border border-dusk-600 bg-dusk-850 text-xs font-medium text-parchment-muted transition hover:text-parchment disabled:opacity-50 ${
            compact ? "px-2.5 py-1" : "w-full px-3 py-2"
          }`}
        >
          {loading ? "Importing…" : compact ? "Import JSON" : "Choose JSON file…"}
        </button>
        {!compact && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-parchment-muted/50">
            Uses HeroPortfolio export format or files from{" "}
            <code className="text-parchment-muted/70">samples/</code>. Replaces the whole
            timeline.
          </p>
        )}
      </div>
    </>
  );
}
