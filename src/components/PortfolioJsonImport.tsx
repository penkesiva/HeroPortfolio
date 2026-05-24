"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { importPortfolioJsonAction } from "@/app/actions/portfolio";
import { AppConfirmDialog } from "@/components/AppConfirmDialog";
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
  const pendingFileRef = useRef<File | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [progressTitle, setProgressTitle] = useState("Importing portfolio");
  const [progressDetail, setProgressDetail] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function runImport(file: File) {
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
      setConfirming(false);
      setProgressDetail(undefined);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setError("Choose a .json file.");
      return;
    }

    pendingFileRef.current = file;
    setPendingFile(file);
  }

  function clearPendingFile() {
    pendingFileRef.current = null;
    setPendingFile(null);
  }

  function handleConfirmImport() {
    const file = pendingFileRef.current ?? pendingFile;
    if (!file) return;
    setConfirming(true);
    setLoading(true);
    clearPendingFile();
    void runImport(file);
  }

  return (
    <>
      <AppConfirmDialog
        open={pendingFile !== null}
        onClose={() => {
          if (confirming || loading) return;
          clearPendingFile();
        }}
        onConfirm={handleConfirmImport}
        variant="warning"
        title="Replace this portfolio?"
        message={
          pendingFile
            ? `Importing "${pendingFile.name}" will replace the entire timeline for this portfolio.`
            : undefined
        }
        note="Export a JSON backup first if you want to keep what's here."
        confirmLabel="Replace & import"
        cancelLabel="Keep current timeline"
        loading={confirming || loading}
      />
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
          onChange={onFileChange}
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
