<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:consistency-rules -->
## Single Source of Truth

**All limits, prices, and repeated copy live in `src/lib/constants.ts`. Never hardcode them inline.**

- `FREE_AI_USES_PER_MONTH` — AI Smart Import free tier limit
- `FREE_AI_LABEL` — user-facing label ("2 uses/month free")
- `FREE_AI_EXHAUSTED_MESSAGE` — error message shown when limit is reached
- `PRICES` — all plan prices (Pro monthly/yearly, Family monthly/yearly)
- `FAMILY_PLAN_MAILTO` — family plan contact link
- `SUPPORT_EMAIL` — contact email address

**Before changing any limit, price, or copy string:**
1. Update `src/lib/constants.ts` first.
2. Run `rg "old value" src/` to find any remaining inline occurrences and fix them.

## Shared UI Components

Repeated UI patterns used across 2+ pages must be extracted into a component.

- **Back button to Timeline** — use `<BackToTimeline />` from `src/components/BackToTimeline.tsx`.
  Do NOT inline the pill-button JSX in individual pages.

When adding a new repeated pattern (e.g. a page header, breadcrumb, empty state), extract it immediately.
<!-- END:consistency-rules -->
