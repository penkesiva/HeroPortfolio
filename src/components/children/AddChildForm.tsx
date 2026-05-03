"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createChildProfileAction } from "@/app/actions/childProfile";

const CURRENT_YEAR = new Date().getFullYear();

const GRADE_OPTIONS = [
  { value: "", label: "— Not set —" },
  { value: "K", label: "Kindergarten" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: `Grade ${i + 1}`,
  })),
];

export function AddChildForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Please enter the child's name.");
      return;
    }
    setSaving(true);
    const gradeNum = grade && grade !== "K" ? parseInt(grade, 10) : grade === "K" ? 0 : null;
    const birthYearNum = birthYear ? parseInt(birthYear, 10) : null;

    const result = await createChildProfileAction({
      display_name: name.trim(),
      grade: gradeNum,
      birth_year: birthYearNum,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/children/${result.data!.id}`);
  }

  const birthYearOptions = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i - 3);

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-dusk-700/80 bg-dusk-900/70 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-parchment">
          Add a child
        </h1>
        <p className="mt-2 text-sm text-parchment-muted">
          Start building their portfolio. You can always edit these details later.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2 text-sm text-red-200/90" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="child-name"
              className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
            >
              Child's name <span className="text-umber-400">*</span>
            </label>
            <input
              id="child-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              autoFocus
              required
              className="mt-2 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment placeholder-parchment-muted/40 focus:border-umber-400/50 focus:outline-none focus:ring-2 focus:ring-umber-400/30"
            />
          </div>

          {/* Grade */}
          <div>
            <label
              htmlFor="child-grade"
              className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
            >
              Current grade
            </label>
            <select
              id="child-grade"
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

          {/* Birth year */}
          <div>
            <label
              htmlFor="child-birth-year"
              className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted"
            >
              Birth year
            </label>
            <select
              id="child-birth-year"
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
