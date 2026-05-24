"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortfolioProfileAction } from "@/app/actions/portfolioProfile";
import type { AccountKind } from "@/types/database";

const CURRENT_YEAR = new Date().getFullYear();

const GRADE_OPTIONS = [
  { value: "", label: "— Not set —" },
  { value: "K", label: "Kindergarten" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Grade ${i + 1}`,
  })),
];

type Props = {
  accountKind: AccountKind;
};

export function AddPortfolioForm({ accountKind }: Props) {
  const router = useRouter();
  const isGuardian = accountKind === "guardian";
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(isGuardian ? "Please enter the child's name." : "Please enter a portfolio name.");
      return;
    }
    setSaving(true);

    const gradeNum =
      grade && grade !== "K" ? parseInt(grade, 10) : grade === "K" ? 0 : null;
    const birthYearNum = birthYear ? parseInt(birthYear, 10) : null;

    const result = await createPortfolioProfileAction({
      display_name: name.trim(),
      portfolio_kind: isGuardian ? "child" : "personal",
      grade: isGuardian ? gradeNum : null,
      birth_year: isGuardian ? birthYearNum : null,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/portfolios/${result.data!.id}`);
  }

  const birthYearOptions = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i - 3);

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/70 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-parchment">
          {isGuardian ? "Add a child" : "Add a portfolio"}
        </h1>
        <p className="mt-2 text-sm text-parchment-muted">
          {isGuardian
            ? "Start building their portfolio. You can always edit these details later."
            : "Create a focused portfolio — music, sports, STEM, or anything else."}
        </p>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm text-red-200/90"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="portfolio-name"
              className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
            >
              {isGuardian ? "Child's name" : "Portfolio name"}{" "}
              <span className="text-umber-400">*</span>
            </label>
            <input
              id="portfolio-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isGuardian ? "e.g. Alex" : "e.g. Music, Varsity soccer"}
              autoFocus
              required
              className="mt-2 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment placeholder-parchment-muted/40 focus:border-umber-400/50 focus:outline-none focus:ring-2 focus:ring-umber-400/30"
            />
          </div>

          {isGuardian ? (
            <>
              <div>
                <label
                  htmlFor="portfolio-grade"
                  className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
                >
                  Current grade
                </label>
                <select
                  id="portfolio-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment focus:border-umber-400/50 focus:outline-none focus:ring-2 focus:ring-umber-400/30"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="portfolio-birth-year"
                  className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
                >
                  Birth year
                </label>
                <select
                  id="portfolio-birth-year"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment focus:border-umber-400/50 focus:outline-none focus:ring-2 focus:ring-umber-400/30"
                >
                  <option value="">— Not set —</option>
                  {birthYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-xl bg-umber-500 py-3 text-sm font-semibold text-white transition hover:bg-umber-400 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create portfolio →"}
          </button>
        </form>
      </div>
    </div>
  );
}
