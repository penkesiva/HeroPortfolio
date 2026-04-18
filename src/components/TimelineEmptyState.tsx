"use client";

import { useMemo, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-react";

interface TimelineEmptyStateProps {
  onAddYear: (year: number) => void;
  onOpenEditor: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

const GRADE_OPTIONS = [
  { value: 5,  label: "5th Grade (Elementary)" },
  { value: 6,  label: "6th Grade (Middle School)" },
  { value: 7,  label: "7th Grade (Middle School)" },
  { value: 8,  label: "8th Grade (Middle School)" },
  { value: 9,  label: "9th Grade · Freshman (High School)" },
  { value: 10, label: "10th Grade · Sophomore (High School)" },
  { value: 11, label: "11th Grade · Junior (High School)" },
  { value: 12, label: "12th Grade · Senior (High School)" },
  { value: 13, label: "College · Year 1" },
  { value: 14, label: "College · Year 2" },
  { value: 15, label: "College · Year 3" },
  { value: 16, label: "College · Year 4+" },
];

function gradeLabel(year: number, currentGrade: number): string {
  const grade = currentGrade - (CURRENT_YEAR - year);
  if (grade < 1) return "";
  if (grade >= 9 && grade <= 12) {
    const tag = ["Freshman", "Sophomore", "Junior", "Senior"][grade - 9];
    return `Grade ${grade} · ${tag} · High School`;
  }
  if (grade >= 6 && grade <= 8) return `Grade ${grade} · Middle School`;
  if (grade >= 1 && grade <= 5) return `Grade ${grade} · Elementary`;
  if (grade > 12) return `College Year ${grade - 12}`;
  return "";
}

export function TimelineEmptyState({
  onAddYear,
  onOpenEditor,
}: TimelineEmptyStateProps) {
  const [currentGrade, setCurrentGrade] = useState(9);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [launched, setLaunched] = useState(false);
  // Keep latest callbacks in a ref so the animation complete handler always
  // sees the current selectedYear without needing to re-register the listener.
  const afterLaunchRef = useRef<() => void>(() => {});

  // Show enough years to reach back to ~grade 5 (elementary), capped at 12 years
  const yearOptions = useMemo(() => {
    const count = Math.min(Math.max(currentGrade - 4, 4), 12);
    return Array.from({ length: count + 1 }, (_, i) => CURRENT_YEAR - i);
  }, [currentGrade]);

  const handleGradeChange = (grade: number) => {
    setCurrentGrade(grade);
    const count = Math.min(Math.max(grade - 4, 4), 12);
    const oldest = CURRENT_YEAR - count;
    if (selectedYear < oldest) setSelectedYear(CURRENT_YEAR);
  };

  const handleStart = () => {
    // Snapshot what to do after the rocket finishes
    afterLaunchRef.current = () => {
      onAddYear(selectedYear);
      onOpenEditor();
    };
    setLaunched(true);
  };

  const onRocketLoad = (instance: DotLottie | null) => {
    if (!instance) return;
    instance.setLoop(false);
    instance.play();
    // Fire the transition exactly when the animation ends — no hardcoded timeout
    instance.addEventListener("complete", () => {
      afterLaunchRef.current();
    });
  };

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {launched ? (
        <DotLottieReact
          src="/animations/rocket_launch.lottie"
          autoplay
          className="h-40 w-40"
          dotLottieRefCallback={onRocketLoad}
        />
      ) : (
        <DotLottieReact
          src="/animations/trophy.lottie"
          loop
          autoplay
          className="h-40 w-40"
        />
      )}

      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-parchment">
        Start logging your story
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-parchment-muted">
        Tell us where you are in school, then pick your earliest year. We will set up every year from there to today.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
            What grade are you in right now?
          </label>
          <select
            value={currentGrade}
            onChange={(e) => handleGradeChange(Number(e.target.value))}
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
          <label className="block text-xs font-semibold uppercase tracking-wide text-parchment-muted">
            Start from which year?
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-dusk-600 bg-dusk-850 px-4 py-3 text-sm text-parchment focus:border-umber-400/50 focus:outline-none focus:ring-2 focus:ring-umber-400/30"
          >
            {yearOptions.map((y) => {
              const label = gradeLabel(y, currentGrade);
              return (
                <option key={y} value={y}>
                  {y}{label ? `  ·  ${label}` : ""}
                </option>
              );
            })}
          </select>
        </div>

        {selectedYear < CURRENT_YEAR && (
          <p className="text-xs text-parchment-muted/55">
            Creates years {selectedYear} through {CURRENT_YEAR}
          </p>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={launched}
          className="w-full rounded-xl border border-umber-500/50 bg-umber-500/20 py-3 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30 disabled:opacity-60"
        >
          {launched ? "Launching…" : "Let's go"}
        </button>
      </div>

      <p className="mt-5 text-xs text-parchment-muted/40">
        Add more school years any time from the editor
      </p>
    </div>
  );
}
