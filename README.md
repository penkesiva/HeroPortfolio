# HeroPortfolio

Year-by-year achievement portfolios for students—timeline, events, photos, badges, and a shareable public link.

**Stack:** [Next.js](https://nextjs.org) (App Router) · React · TypeScript · Tailwind CSS · [Supabase](https://supabase.com) (auth + DB + storage) · Stripe (Pro / Family billing)

---

## Plans at a glance: Basic (Free) vs Pro

Use this table as the **working comparison** for positioning; tune copy and numbers from a business angle anytime. **Authoritative limits in code** live in `src/lib/planGate.ts` (caps + feature flags) and `src/lib/constants.ts` (AI free tier + prices)—update those first, then align this README.

Rows are grouped: **timeline & storage** → **exports** (together) → **AI & analytics** → **rich media** → **every plan**.

| Feature | Basic (Free) | Pro |
|---------|--------------|-----|
| **Events per school year** | Up to **12** | **Unlimited** |
| **Photos per event** | Up to **3** | **Unlimited** |
| **Total portfolio storage** | **500 MB** | **10 GB** |
| **Cross-year album / masonry gallery** | Standard per-event gallery (within photo limits) | **Full album** across all years |
| **JSON export** (backup) | **Included** | **Included** |
| **CSV export** | — | **Included** |
| **PDF Achievement Book** | — | **Included** |
| **AI Smart Import** (link → draft event) | **2 uses / calendar month** | **Unlimited** |
| **Profile analytics** (views, referrers) | — | **Included** |
| **Video on events** | **YouTube / Vimeo links** | Links + **file upload** (UI gated Pro; upload wiring as shipped) |
| **Music on events** | **Spotify / SoundCloud / URL embeds** | Embeds + **audio file upload** (e.g. MP3, WAV, …) |
| **Milestone badges** | **Included** | **Included** |
| **Themes** | Light & dark | Light & dark |
| **Public portfolio** | **1** shareable profile | **1** shareable profile |

**Family plan (separate SKU):** Pro-level feature set for **up to 4** household accounts, one bill—details on the in-app **Plans** page and in `src/lib/constants.ts` (`PRICES.family`, `FAMILY_PLAN_MAILTO`).

---

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Configure **Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and any Stripe keys your local billing flow needs in `.env.local`. Database migrations live under `supabase/migrations/`.

```bash
npm run lint
npm run build
```

---

## Deploy

Typical deployment: [Vercel](https://vercel.com) or any Node host that supports Next.js. Set production env vars to match Supabase and Stripe dashboard settings.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
