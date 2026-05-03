// ─── Single source of truth for all limits, prices, and shared copy ──────────
//
// RULE: Never hardcode these values inline anywhere in the codebase.
// Import from here so a one-line change propagates everywhere.

// ── AI Smart Import ───────────────────────────────────────────────────────────
export const FREE_AI_USES_PER_MONTH = 2;
export const FREE_AI_LABEL = `${FREE_AI_USES_PER_MONTH} uses/month free`;
export const FREE_AI_EXHAUSTED_MESSAGE = `You've used your ${FREE_AI_USES_PER_MONTH} free AI summaries this month. Upgrade to Pro for unlimited access.`;

// ── Subscription prices (USD) ─────────────────────────────────────────────────
export const PRICES = {
  // Student (self account) — flat monthly/yearly
  studentPro: {
    monthly: 1.99,
    yearly: 15.99,   // ~$1.33/mo, saves 33%
  },
  // Parent (guardian account) — per child per month
  parentPro: {
    perChildMonthly: 1.49,
    perChildYearly: 11.99,  // ~$1.00/child/mo, saves 33%
  },
} as const;

// ── Guardian free tier ────────────────────────────────────────────────────────
/** Number of child profiles a guardian can have on the free plan. */
export const FREE_CHILD_LIMIT = 2;

// ── Upgrade copy ──────────────────────────────────────────────────────────────
export const PARENT_UPGRADE_HEADLINE = "Unlock more children + all Pro features";
export const PARENT_UPGRADE_BODY =
  `You've reached the free limit of ${FREE_CHILD_LIMIT} child portfolios. Upgrade to Parent Pro for $${PRICES.parentPro.perChildMonthly}/child/mo and get unlimited children with all Pro features for your whole family.`;

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
export const SUPPORT_EMAIL = "hello@heroportfolio.com";
export const FAMILY_PLAN_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=Family%20Plan%20Interest&body=Hi%2C%20I%27d%20like%20to%20set%20up%20a%20Family%20plan%20for%20my%20household.`;
