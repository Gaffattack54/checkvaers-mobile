# CheckVAERS

Mobile-first PWA that lets a user check whether a COVID-19 adverse event
matching their details has been reported to VAERS. All matching happens
on-device against a static, pre-prepared snapshot of the public VAERS
dataset — no PII ever leaves the device.

- Live spec: [`SPEC.md`](./SPEC.md)
- Project memory for Claude Code: [`CLAUDE.md`](./CLAUDE.md)
- Cross-device pickup: [`HANDOFF.md`](./HANDOFF.md)
- Migrating to a real backend later: [`MIGRATION.md`](./MIGRATION.md)

---

## Quick start

```bash
git clone https://github.com/Gaffattack54/checkvaers-mobile.git
cd checkvaers-mobile
npm install
npm run dev
```

Open <http://localhost:3000> in a phone-sized viewport (or DevTools mobile
emulation). Without any environment variables set, the app runs against
50 bundled sample records — enough to exercise the full UX.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server at `localhost:3000`. |
| `npm run build` | Production build. Run before declaring a step done. |
| `npm run start` | Serves the production build. |
| `npm run test` | Vitest unit suite (matcher logic). |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run prepare:vaers` | Builds the real VAERS data snapshot from local CSVs (see below). |
| `npm run generate:icons` | Regenerates PWA icon PNGs from `public/icons/icon-source.svg`. |

---

## Stack

Strictly per `SPEC.md` — don't swap without asking:

- **Next.js 14** (App Router, TypeScript, no `src/` directory)
- **Tailwind CSS** with shadcn/ui-style primitives (manual install, no
  shadcn CLI dependency)
- **React Hook Form + Zod** for forms / validation
- **TanStack Query + Zustand** for app state (Zustand drives the
  in-progress check draft; TanStack room is reserved for future async)
- **Dexie.js** for IndexedDB (history, checklist drafts, downloaded data
  cache)
- **Papaparse, date-fns, lucide-react**
- **Custom service worker** (hand-rolled — `next-pwa` is unmaintained and
  breaks with App Router; see Step 11 note in `CLAUDE.md`)

---

## Architecture in 60 seconds

```
app/
  (tabs)/                Routes that share the bottom tab bar
    layout.tsx           Mounts <BottomTabs />
    check/               Multi-step check flow
      page.tsx           Tab landing with start CTA
      state/             Step 1 — state picker
      sex/               Step 2 — sex
      dob/               Step 3 — DOB → age
      doses/             Step 4 — dose dates
      review/            Step 5 — review
      result/            Step 6 (loading) + 7 (result branching)
    learn/               Expandable educational cards
    report/              Interactive VAERS checklist + deep link
    history/             Past checks list
      [id]/              Past check detail
  privacy/               Standalone privacy page
  manifest.ts            PWA manifest
  layout.tsx             Root layout, fonts, SW registrar

lib/
  vaers/
    types.ts             VaersRecord, MatchInput, MatchResult
    matcher.ts           findMatches() — exact + potential buckets
    mock-data.ts         50 hand-crafted records for development
    us-states.ts         USPS code list
    dates.ts             local-midnight conversion helpers
    data-loader.ts       useVaersData() — URL fetch + Dexie cache + mock fallback
  state/check-store.ts   Zustand draft persisted to sessionStorage
  storage/db.ts          Dexie schema + repos (checks, reports, dataCache)
  validation/schemas.ts  Zod schemas for the check flow
  utils.ts               cn() helper

components/
  ui/                    shadcn-style primitives (Button, Input)
  shared/                BottomTabs, SW registrar, disclaimer, expandable card
  check-flow/            Progress dots, step header
  result-cards/          Exact / potential / no-match cards
```

The matcher (`lib/vaers/matcher.ts`) is the heart of the app. Its
contract: feed it `MatchInput` (state, sex, ageYears, **local-midnight**
Date[]) plus an array of records. It returns `{ exact, potential, none }`.
See `lib/vaers/__tests__/matcher.test.ts` for the rules in executable
form.

---

## Refreshing the VAERS data snapshot

The app reads from a single gzipped JSON file. The file lives wherever
you want (Cloudflare R2 / GitHub Release / Vercel public asset — your
call); the app finds it via `NEXT_PUBLIC_VAERS_DATA_URL`.

1. **Download the source CSVs.** VAERS publishes year-by-year ZIPs at
   <https://vaers.hhs.gov/data/datasets.html>. The download page is
   session-gated — fetching can't be reliably automated, so this is a
   manual step. Grab the year ZIPs you want covered (typically the last
   7 years).
2. **Extract them into `./vaers-raw/`** at the repo root. After
   extraction you should see files named like
   `2023VAERSDATA.csv`, `2023VAERSVAX.csv`, `2023VAERSSYMPTOMS.csv` for
   each year.
3. **Run the prepare script:**
   ```bash
   npm run prepare:vaers
   ```
   This filters to COVID-19 only, joins on `VAERS_ID`, drops fields not
   used by the matcher / UI, sorts for deterministic gzip output, and
   writes `./dist/vaers-covid-7yr.json.gz`. The result should be ~30–50
   MB compressed.
4. **Upload `./dist/vaers-covid-7yr.json.gz`** to your hosting target:
   - **Cloudflare R2** — create a public bucket, upload the file, copy
     the public URL.
   - **GitHub Release** — `gh release create vNNN ./dist/...gz`, then
     copy the asset URL from the Release page.
5. **Set `NEXT_PUBLIC_VAERS_DATA_URL`** in `.env.local` (development)
   and in Vercel's project settings (production) to the public URL.
6. **Restart** `npm run dev`. First page load will fetch + cache the new
   snapshot; subsequent loads check the ETag and skip re-download until
   the file changes.

`./vaers-raw/` and `./dist/` are both gitignored — they're large,
local-only artifacts.

---

## Deploying to Vercel

```bash
# From the repo root
vercel
# (or push to `main` if you've already linked the repo to Vercel)
```

In Vercel project settings:

- **Build command:** `npm run build` (default works)
- **Output directory:** `.next` (default)
- **Install command:** `npm install`
- **Environment variables:**
  - `NEXT_PUBLIC_VAERS_DATA_URL` — public URL of your prepared snapshot.
    Omit to ship on mock data (e.g. for preview deployments).

The app is fully static apart from `/history/[id]` (dynamic route for
serving stored check detail pages). HTTPS is automatic on Vercel.

---

## Installing CheckVAERS as a PWA (end-user instructions)

### iOS / iPadOS (Safari)

1. Open the live URL in Safari.
2. Tap the Share button (square with up-arrow).
3. Scroll to **"Add to Home Screen"**.
4. Confirm the name and tap **Add**.

The app launches in standalone mode (no Safari chrome), respects safe
areas, and works offline after the first visit.

### Android (Chrome / Edge)

1. Open the live URL.
2. Chrome shows an **"Install app"** banner after a few seconds, or
   tap the ⋮ menu → **"Install app"** / **"Add to Home screen"**.
3. Confirm.

### Desktop (Chrome / Edge)

1. Open the live URL.
2. Click the install icon in the address bar (looks like a small
   monitor with a down-arrow).
3. Confirm.

---

## Privacy posture

- No PII transmitted, ever. The matcher runs in the browser against a
  cached snapshot.
- No tracking, no analytics by default. The optional Plausible hook is
  documented in `.env.example` but unset.
- All persistent state (history, report checklist, data cache) lives in
  IndexedDB on the user's device.
- Detailed write-up at `/privacy` in the app.

---

## Contributing

Build strictly in the order laid out in `SPEC.md`. Stop after each step
and let the maintainer verify before continuing. After each step lands,
tick its box in `CLAUDE.md`.
