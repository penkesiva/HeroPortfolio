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

// ── Portfolio limits (guardian children + student portfolios) ─────────────────
/** Number of portfolios (children or personal) on the free plan. */
export const FREE_PORTFOLIO_LIMIT = appConfig.limits.freeChildProfiles;
/** @deprecated Use FREE_PORTFOLIO_LIMIT */
export const FREE_CHILD_LIMIT = FREE_PORTFOLIO_LIMIT;

// ── Portfolio hub copy ────────────────────────────────────────────────────────
export const PORTFOLIOS_PAGE_TITLE = "My Portfolios";
export const PORTFOLIOS_PAGE_META_DESCRIPTION =
  "Manage your portfolios — timelines, sharing, and backups.";
export const PORTFOLIOS_GUARDIAN_EYEBROW = "Guardian";
export const PORTFOLIOS_STUDENT_EYEBROW = "Student";
export const PORTFOLIOS_EMPTY_HEADLINE = "No portfolios yet";
export const PORTFOLIOS_EMPTY_BODY_SELF =
  "Add your first portfolio to start tracking achievements.";
export const PORTFOLIOS_EMPTY_BODY_GUARDIAN =
  "Add your first child to start building their portfolio together.";
export const PORTFOLIOS_ADD_LABEL_SELF = "Add portfolio";
export const PORTFOLIOS_ADD_LABEL_GUARDIAN = "Add child";
export const PORTFOLIOS_LIMIT_UPGRADE_BODY =
  `Upgrade to Pro for unlimited portfolios and all Pro features for your account.`;
export const PORTFOLIOS_FREE_USAGE_LABEL = (used: number, limit: number) =>
  `${used} / ${limit} free portfolios used`;

// ── Pricing page copy ─────────────────────────────────────────────────────────
export const PRICING_PAGE_META_DESCRIPTION =
  `HeroPortfolio is free to start with up to ${FREE_PORTFOLIO_LIMIT} portfolios. Student Pro unlocks unlimited portfolios, events, AI import, and PDF export for ${STUDENT_PRO_MONTHLY_PRICE_LABEL}. Parent Pro adds unlimited child portfolios for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL}.`;
export const PRICING_PAGE_GUARDIAN_SUBHEAD =
  `Start free with up to ${FREE_PORTFOLIO_LIMIT} portfolios per account. Upgrade to Parent Pro for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL} to add unlimited children and unlock all Pro features for your whole family.`;
export const PRICING_PAGE_STUDENT_SUBHEAD =
  `Start free with up to ${FREE_PORTFOLIO_LIMIT} portfolios — music, sports, achievements, and more. Upgrade to Student Pro for unlimited portfolios, AI-powered import, unlimited events, and PDF export — for less than a coffee per month.`;
export const PRICING_FREE_PLAN_TAGLINE_GUARDIAN =
  `Everything you need to get started with up to ${FREE_PORTFOLIO_LIMIT} child portfolios.`;
export const PRICING_FREE_PLAN_TAGLINE_SELF =
  `Up to ${FREE_PORTFOLIO_LIMIT} portfolios — music, sports, achievements, and more.`;
export const PRICING_STUDENT_PRO_TAGLINE =
  "Unlimited portfolios for music, sports, achievements, and college apps.";

// ── Upgrade copy ──────────────────────────────────────────────────────────────
export const PARENT_UPGRADE_HEADLINE = "Unlock more children + all Pro features";
export const PARENT_UPGRADE_BODY =
  `You've reached the free limit of ${FREE_PORTFOLIO_LIMIT} portfolios. Upgrade to Parent Pro for ${PARENT_PRO_PER_CHILD_MONTHLY_PRICE_LABEL} and get unlimited portfolios with all Pro features for your whole family.`;
export const CHILD_LIMIT_UPGRADE_BODY = PORTFOLIOS_LIMIT_UPGRADE_BODY;

// ── Onboarding: who is the portfolio for? (once per account) ─────────────────
export const ONBOARDING_ACCOUNT_KIND_EYEBROW = "Important — please choose";
export const ONBOARDING_ACCOUNT_KIND_HEADLINE =
  "Setting this up for yourself or for your child(ren)?";
export const ONBOARDING_ACCOUNT_KIND_SUBHEAD =
  "This is a one-time step so we can show the right experience. You can still change details in your portfolio later.";
export const ONBOARDING_ACCOUNT_KIND_SELF_TITLE = "For myself";
export const ONBOARDING_ACCOUNT_KIND_SELF_BODY =
  "One login, multiple portfolios — achievements, music, sports, and more.";
export const ONBOARDING_ACCOUNT_KIND_GUARDIAN_TITLE = "For my child (or children)";
export const ONBOARDING_ACCOUNT_KIND_GUARDIAN_BODY =
  "One login to manage your children's portfolios from a single dashboard.";

// ── Portfolio visibility ──────────────────────────────────────────────────────
export const PORTFOLIO_VISIBILITY_PUBLIC_LABEL = "Public";
export const PORTFOLIO_VISIBILITY_PRIVATE_LABEL = "Private";
export const PORTFOLIO_PRIVATE_SHARE_HINT =
  "Turn on public sharing to copy a share link.";
export const PORTFOLIO_PRIVATE_PAGE_TITLE = "This portfolio is private";
export const PORTFOLIO_PRIVATE_PAGE_MESSAGE =
  "The owner hasn't shared this portfolio publicly yet.";
export const PORTFOLIO_VISIBILITY_PUBLIC_HINT =
  "Anyone with the link can view this portfolio.";
export const PORTFOLIO_VISIBILITY_PRIVATE_HINT =
  "Only you can view this portfolio. Turn on public sharing when you're ready.";
export const PORTFOLIO_COPY_SHARE_LINK_LABEL = "Copy share link";
export const PORTFOLIO_COPIED_SHARE_LINK_LABEL = "Link copied";
export const PORTFOLIO_COPY_SHARE_LINK_FAILED_LABEL = "Try again";

// ── Contact / mailto ──────────────────────────────────────────────────────────
export const SUPPORT_EMAIL = appConfig.contact.supportEmail;
export const FAMILY_PLAN_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=Family%20Plan%20Interest&body=Hi%2C%20I%27d%20like%20to%20set%20up%20a%20Family%20plan%20for%20my%20household.`;
