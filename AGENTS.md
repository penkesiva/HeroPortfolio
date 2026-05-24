<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:consistency-rules -->
## Single Source of Truth

**Tunable limits and prices live in `config/app.config.json` (project root). Never hardcode them in source.**

App code reads values via `src/lib/constants.ts` (derived labels and copy). Import from constants in components — not from the JSON directly.

- `config/app.config.json` → `pricing`, `limits`, `contact`
- `FREE_AI_USES_PER_MONTH` — from `limits.freeAiUsesPerMonth`
- `FREE_CHILD_LIMIT` — from `limits.freeChildProfiles`
- `PRICES` — from `pricing`
- `SUPPORT_EMAIL` — from `contact.supportEmail`

**Before changing any limit, price, or contact email:**
1. Update `config/app.config.json` first.
2. Run `rg "old value" src/` to find any remaining inline occurrences and fix them.
3. Update Stripe env vars separately if billing amount changed.

## Shared UI Components

Repeated UI patterns used across 2+ pages must be extracted into a component.

- **Back button to Timeline** — use `<BackToTimeline />` from `src/components/BackToTimeline.tsx`.
  Do NOT inline the pill-button JSX in individual pages.

When adding a new repeated pattern (e.g. a page header, breadcrumb, empty state), extract it immediately.
<!-- END:consistency-rules -->
