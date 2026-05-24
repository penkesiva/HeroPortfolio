// ─── App limits, prices, and shared copy ─────────────────────────────────────
//
// Tunable numbers live in config/app.config.json (project root).
// This file reads that config and builds labels + copy for the app.
// Do not hardcode prices or limits elsewhere — import from here.

import appConfig from "../../config/app.config.json";

// ── AI Smart Import ───────────────────────────────────────────────────────────
export const FREE_AI_USES_PER_MONTH = appConfig.limits.freeAiUsesPerMonth;
export const FREE_AI_LABEL = `${FREE_AI_USES_PER_MONTH} uses/month free`;
export const FREE_AI_EXHAUSTED_MESSAGE = `You've used your ${FREE_AI_USES_PER_MONTH} free AI summaries this month. Upgrade to Pro for unlimited access.`;

// ── Subscription prices (USD) ─────────────────────────────────────────────────
export const PRICES = appConfig.pricing;

const usd = (amount: number) => amount.toFixed(2);

/** Display labels derived from PRICES — use these in copy, never literal amounts. */
export const STUDENT_PRO_MONTHLY_PRICE_LABEL = `$${usd(PRICES.studentPro.monthly)}/mo`;
export const PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL = `$${usd(PRICES.parentPro.perChildMonthly)}/child/mo`;

// ── Guardian free tier ────────────────────────────────────────────────────────
/** Number of child profiles a guardian can have on the free plan. */
export const FREE_CHILD_LIMIT = appConfig.limits.freeChildProfiles;

// ── Pricing page copy ─────────────────────────────────────────────────────────
export const PRICING_PAGE_META_DESCRIPTION =
  `HeroPortfolio is free to start. Student Pro unlocks unlimited events, AI import, and PDF export for ${STUDENT_PRO_MONTHLY_PRICE_LABEL}. Parent Pro adds unlimited child portfolios for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL}.`;
export const PRICING_PAGE_GUARDIAN_SUBHEAD =
  `Start free with up to ${FREE_CHILD_LIMIT} child portfolios. Upgrade to Parent Pro for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL} to add unlimited children and unlock all Pro features for your whole family.`;
export const PRICING_PAGE_STUDENT_SUBHEAD =
  "Start free with a full portfolio. Upgrade to Student Pro for AI-powered import, unlimited events, and PDF export — for less than a coffee per month.";

// ── Upgrade copy ──────────────────────────────────────────────────────────────
export const PARENT_UPGRADE_HEADLINE = "Unlock more children + all Pro features";
export const PARENT_UPGRADE_BODY =
  `You've reached the free limit of ${FREE_CHILD_LIMIT} child portfolios. Upgrade to Parent Pro for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL} and get unlimited children with all Pro features for your whole family.`;
export const CHILD_LIMIT_UPGRADE_BODY =
  `Upgrade to Parent Pro for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL} to add unlimited children and unlock all Pro features for your whole family.`;

// ── Onboarding: who is the portfolio for? (once per account) ─────────────────
export const ONBOARDING_ACCOUNT_KIND_EYEBROW = "Important — please choose";
export const ONBOARDING_ACCOUNT_KIND_HEADLINE =
  "Setting this up for yourself or for your child(ren)?";
export const ONBOARDING_ACCOUNT_KIND_SUBHEAD =
  "This is a one-time step so we can show the right experience. You can still change details in your portfolio later.";
export const ONBOARDING_ACCOUNT_KIND_SELF_TITLE = "For myself";
export const ONBOARDING_ACCOUNT_KIND_SELF_BODY =
  "One login, one portfolio — your achievements and timeline.";
export const ONBOARDING_ACCOUNT_KIND_GUARDIAN_TITLE = "For my child (or children)";
export const ONBOARDING_ACCOUNT_KIND_GUARDIAN_BODY =
  "One login to manage your kids’ portfolios (child profiles and parent dashboard are rolling out next).";

// ── Contact / mailto ──────────────────────────────────────────────────────────
export const SUPPORT_EMAIL = appConfig.contact.supportEmail;
export const FAMILY_PLAN_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=Family%20Plan%20Interest&body=Hi%2C%20I%27d%20like%20to%20set%20up%20a%20Family%20plan%20for%20my%20household.`;
