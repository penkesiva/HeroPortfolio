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
  pro: {
    monthly: 4.99,
    yearly: 39.99,
  },
  family: {
    monthly: 11.99,
    yearly: 89.99,
  },
} as const;

// ── Contact / mailto ──────────────────────────────────────────────────────────
export const SUPPORT_EMAIL = "hello@heroportfolio.com";
export const FAMILY_PLAN_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=Family%20Plan%20Interest&body=Hi%2C%20I%27d%20like%20to%20set%20up%20a%20Family%20plan%20for%20my%20household.`;
