import Link from "next/link";
import type { ReactNode } from "react";
import { HomeLottie } from "@/components/home/HomeLottie";
import {
  LANDING_FINAL_BODY,
  LANDING_FINAL_CTA,
  LANDING_FINAL_HEADLINE,
  LANDING_FINAL_MICROCOPY,
  LANDING_HERO_HEADLINE,
  LANDING_HERO_SUBHEAD,
  LANDING_HOW_IT_WORKS_SHARE_BODY,
  LANDING_LOGIN_CTA,
  LANDING_PARENT_LINK,
  LANDING_PARENT_SIGNUP_CTA,
  LANDING_PRIMARY_CTA,
  LANDING_PRIMARY_CTA_SHORT,
  LANDING_SIGNUP_NEXT_ONBOARDING,
  LANDING_TRUST_STRIP,
} from "@/lib/constants";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Sign up",
    body: "Create your free account — for yourself or as a parent managing child portfolios.",
  },
  {
    step: "2",
    title: "Log it",
    body: "Add achievements in under a minute — title, year, category, photos, and links.",
  },
  {
    step: "3",
    title: "Share it",
    body: LANDING_HOW_IT_WORKS_SHARE_BODY,
  },
] as const;

const FOR_STUDENTS = [
  {
    title: "Never lose a win again",
    body: "Clubs, competitions, honor roll, volunteer hours, summer projects — they're scattered across emails, school portals, and fading memories. HeroPortfolio catches them all in one place.",
  },
  {
    title: "Stand out when it counts",
    body: "College applications, scholarship essays, internship interviews — they all ask the same question: \"What have you done?\" Turn scattered accomplishments into a clean, shareable profile you can send with one link.",
  },
  {
    title: "Watch your journey unfold",
    body: "Every badge, every entry, every milestone — visible on a timeline that grows with you from elementary school through college. See where you started, how far you've come, and what's next.",
  },
] as const;

const FOR_PARENTS = [
  {
    title: "One dashboard for every child",
    body: "Create profiles for all your kids. See what they've achieved and where they're heading — without digging through old report cards and buried emails.",
  },
  {
    title: "Be the coach, not the chaser",
    body: "Add achievements on behalf of younger kids and help them build the habit early. As they grow, they take the reins — and you shift from manager to mentor.",
  },
  {
    title: "Ready for every deadline",
    body: "College applications, scholarship forms, summer program submissions — they all demand an achievement list. Your child's record stays current, organized, and one click away.",
  },
] as const;

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
      {children}
    </p>
  );
}

function BenefitCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-dusk-700/80 bg-dusk-900/50 p-5 sm:p-6">
      <h3 className="text-base font-semibold text-parchment">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-parchment-muted">{body}</p>
    </article>
  );
}

export function LandingPageContent() {
  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
        <div className="order-1 flex flex-col">
          <SectionEyebrow>For students &amp; parents</SectionEyebrow>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-parchment sm:mt-4 sm:text-5xl sm:leading-tight lg:text-[2.75rem] lg:leading-tight">
            {LANDING_HERO_HEADLINE}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-parchment-muted sm:mt-5 sm:text-[17px]">
            {LANDING_HERO_SUBHEAD}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-umber-500/50 bg-umber-500/20 px-6 py-2.5 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/30 sm:py-3"
              >
                <span className="sm:hidden">{LANDING_PRIMARY_CTA_SHORT}</span>
                <span className="hidden sm:inline">{LANDING_PRIMARY_CTA}</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-dusk-600 bg-dusk-850/80 px-6 py-2.5 text-sm font-medium text-parchment-muted transition hover:border-dusk-500 hover:text-parchment sm:py-3"
              >
                {LANDING_LOGIN_CTA}
              </Link>
            </div>
            <Link
              href="#for-parents"
              className="inline-flex items-center gap-1 text-sm font-medium text-umber-300/90 underline decoration-umber-500/40 underline-offset-4 transition hover:text-umber-200"
            >
              {LANDING_PARENT_LINK}
              <span aria-hidden>→</span>
            </Link>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 sm:mt-8">
            {LANDING_TRUST_STRIP.map((item) => (
              <li
                key={item}
                className="flex items-center gap-1.5 text-xs text-parchment-muted/70"
              >
                <span className="text-umber-400" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="order-2 flex items-center justify-center lg:justify-end">
          <div className="relative flex h-[220px] w-[220px] items-center justify-center sm:h-[320px] sm:w-[320px] lg:h-[420px] lg:w-[420px]">
            <HomeLottie />
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-dusk-700/60 bg-dusk-900/25 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            Three steps to a portfolio you&apos;re proud of
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-dusk-700/70 bg-dusk-950/60 p-5 sm:p-6"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-umber-500/20 text-sm font-bold tabular-nums text-umber-200">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-semibold text-parchment">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-parchment-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── For students ─────────────────────────────────────────────────── */}
      <section id="for-students" className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionEyebrow>For students</SectionEyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            Your story, fully captured
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {FOR_STUDENTS.map((item) => (
              <BenefitCard key={item.title} title={item.title} body={item.body} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── For parents ──────────────────────────────────────────────────── */}
      <section
        id="for-parents"
        className="border-t border-dusk-700/60 bg-dusk-900/25 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionEyebrow>For parents</SectionEyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            Champion their journey
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-parchment-muted sm:text-[15px]">
            One login to manage every child&apos;s portfolio — add events, track
            milestones, and share their story when applications come due.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {FOR_PARENTS.map((item) => (
              <BenefitCard key={item.title} title={item.title} body={item.body} />
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={`/signup?next=${encodeURIComponent(LANDING_SIGNUP_NEXT_ONBOARDING)}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-umber-500/45 bg-umber-500/15 px-5 py-2.5 text-sm font-semibold text-umber-200 transition hover:bg-umber-500/25"
            >
              {LANDING_PARENT_SIGNUP_CTA}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-dusk-700/60 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-parchment sm:text-3xl">
            {LANDING_FINAL_HEADLINE}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-parchment-muted sm:text-[17px]">
            {LANDING_FINAL_BODY}
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center whitespace-nowrap rounded-full border border-umber-500/50 bg-umber-500/25 px-8 py-3 text-sm font-semibold text-umber-100 transition hover:bg-umber-500/35"
          >
            {LANDING_FINAL_CTA}
          </Link>
          <p className="mt-3 text-xs text-parchment-muted/60">
            {LANDING_FINAL_MICROCOPY}
          </p>
        </div>
      </section>
    </>
  );
}
