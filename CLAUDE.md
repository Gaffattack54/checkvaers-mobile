# CheckVAERS — Claude Code project memory

This file is read automatically by Claude Code at the start of every session in
this repo. Keep it short and current. The full build spec lives in
[`SPEC.md`](./SPEC.md) — read it before making non-trivial decisions.

## What this is

Mobile-first PWA that replicates checkvaers.com. Lets a user check whether a
COVID-19 adverse event matching their details has been reported to VAERS. All
matching happens client-side against a static, pre-prepared JSON snapshot of
the public VAERS dataset (last 7 years, COVID-19 only). No PII leaves the device.

## Non-negotiable stack

- Next.js 14 (App Router, TypeScript, **no `src/` dir**)
- Tailwind CSS + shadcn/ui (manual install — no shadcn CLI runs)
- React Hook Form + Zod
- TanStack Query + Zustand
- Dexie.js (IndexedDB)
- Papaparse, date-fns, lucide-react
- next-pwa for service worker / offline
- Deployed to Vercel; data file hosted on Cloudflare R2 or GitHub Releases

Do **not** swap any of these without asking.

## Brand tokens

- Primary cyan: `#29C5F6` → Tailwind `brand-cyan` and shadcn `--primary`
- Dark navy: `#0B1B3B` → Tailwind `brand-navy` and shadcn `--secondary`
- White bg with a low-opacity hex SVG pattern (`/public/patterns/hex.svg`)
- Inter font (loaded via `next/font/google`, exposed as `--font-inter`)
- Pill buttons (`rounded-full`), min 48px tap targets, `shadow-card`,
  `rounded-2xl` cards

Tokens defined in `tailwind.config.ts` and `app/globals.css`. When adding new
UI, prefer existing tokens over raw hex.

## Where things live

```
app/             routes (App Router)
components/ui/   shadcn primitives (Button is in place)
components/{check-flow,result-cards,shared}/   feature components
lib/utils.ts     cn() helper
lib/vaers/       data loader, matcher, types, mock data
lib/storage/     Dexie schema
lib/validation/  Zod schemas
public/patterns/ hex SVG
scripts/         (not yet) prepare-vaers-data.ts
```

## Build order + current progress

Spec lays out 13 steps. After each one, **stop and let the user verify** before
continuing. Current state (update as you go):

- [x] **1.** Scaffold + Tailwind + shadcn + theme tokens
- [x] **2.** Bottom tab navigation shell (4 placeholder screens)
- [x] **3.** Mock VAERS data (50 records)
- [x] **4.** Matching logic + unit tests
- [x] **5.** Check flow (steps 1–7) wired to mock data
- [x] **6.** Result screens (exact / potential / none)
- [x] **7.** Learn tab content
- [x] **8.** Report tab flow
- [x] **9.** History tab + IndexedDB
- [x] **10.** Real data pipeline (code complete; awaiting host upload)
- [ ] **11.** PWA (manifest, icons, service worker, offline) ← **next**
- [ ] **12.** Polish (animations, empty/error states, a11y)
- [ ] **13.** README + MIGRATION.md

When you finish a step, tick the box here and commit.

## Commands

```
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build — run before declaring a step done
npm run start        # serve the production build
npm run test         # run Vitest suite once (CI mode)
npm run test:watch   # Vitest in watch mode
```

No lint script wired up yet (we scaffolded with `--no-eslint`).

## Matcher contract (Step 4)

`lib/vaers/matcher.ts → findMatches(input, records)`. **User-supplied
`vaccineDates` must be local-midnight Date objects** (i.e. constructed via
`new Date(y, m-1, d)`, not `new Date("YYYY-MM-DD")` which is UTC midnight).
The form layer respects this via `localDateFromIso()` in
`lib/vaers/dates.ts`. As long as callers use that helper, the matcher is
timezone-agnostic.

## Check flow architecture (Steps 5–6)

- Draft state lives in **Zustand** (`lib/state/check-store.ts`), persisted
  to `sessionStorage` so a refresh mid-flow doesn't wipe inputs.
- Routes: `/check` → `/check/state` → `/check/sex` → `/check/dob` →
  `/check/doses` → `/check/review` → `/check/result`. The bottom tab bar
  stays mounted throughout (the user can bail to Learn/Report/History at
  any point — draft is preserved until they hit "Start a new check").
- Validation is **Zod** (`lib/validation/schemas.ts`). Each step parses
  its slice on submit; `/check/review` re-parses the whole draft before
  enabling the "Check VAERS" CTA.
- Dates flow as `YYYY-MM-DD` strings everywhere until the matcher call —
  that's where `localDateFromIso()` is applied.

### Matcher is still inline (not a Web Worker)

The spec wanted matching to run in a Web Worker. With the 50-record mock
dataset that's overkill — the match completes in well under a frame, and
the artificial 700ms delay in `/check/result` is purely UX. **Move to a
real Worker in Step 10**, once the real ~100k-record snapshot is loaded.
The boundary is small: it's the `findMatches(input, records)` call inside
the `useEffect` of `app/(tabs)/check/result/page.tsx`.

## Local persistence (Steps 8–9)

Dexie + IndexedDB. Two tables, lazy-initialized so SSR never touches it:

- `checks` — every completed check is fire-and-forget saved by
  `/check/result`. Stored fields: input snapshot (state/sex/dob/age/dose
  dates) + the full MatchResult. History list and `/history/[id]` detail
  view both read from this. Errors are non-fatal (private-mode browsers,
  quota issues).
- `reports` — single-row pattern keyed by `id="current"`. The Report
  tab's interactive checklist + free-text notes auto-save on toggle /
  on blur. "Reset checklist" deletes the row.

Repo wrappers (`checksRepo`, `reportRepo`, `dataCacheRepo`) live in
`lib/storage/db.ts` — keep direct `getDb()` usage out of components.

## Real data pipeline (Step 10) — status: code complete, hosting deferred

- `scripts/prepare-vaers-data.ts` — Node CLI (run with
  `npm run prepare:vaers`) that reads extracted VAERS CSVs from
  `./vaers-raw/`, filters to COVID-19, joins on VAERS_ID, sorts, gzips
  to `./dist/vaers-covid-7yr.json.gz`. Both dirs are gitignored.
- `lib/vaers/data-loader.ts` — `useVaersData()` hook. Behavior:
  - **`NEXT_PUBLIC_VAERS_DATA_URL` unset** → mock dataset, instant.
  - **set + cache fresh (ETag match)** → cache, instant, offline-ok.
  - **set + cache stale or absent** → HEAD-checks ETag, streams the
    gzip, decompresses with `DecompressionStream`, parses, caches in
    Dexie (`dataCacheRepo`), emits progress events.
  - **Network failure** → cached snapshot if any; otherwise mock with
    a non-blocking error message.
- `/check/result` waits for the loader's "ready" (or "error with
  fallback") before running the matcher. The download screen shows
  progress only when actually downloading; matching-phase shows the
  original "Searching VAERS database…" copy.
- **To flip on real data:** drop the produced `.json.gz` on
  Cloudflare R2 or attach to a GitHub Release, then set
  `NEXT_PUBLIC_VAERS_DATA_URL` in `.env.local`. No code changes.

## Cross-device notes

This repo is on two machines, both using Claude Code. A few things to know:

- **Task lists are session-scoped.** `TaskCreate` tasks don't sync across
  devices or sessions. Treat the checklist above as the source of truth for
  "where are we." If you start a session, re-create tasks from the unchecked
  items if you want progress tracking.
- **`.claude/settings.json` is committed** (shared permissions). Do not put
  per-user overrides there — use `.claude/settings.local.json` (gitignored).
- **`.env.local` is gitignored.** When `NEXT_PUBLIC_VAERS_DATA_URL` is set up,
  copy from `.env.example` on each device.
- Before starting a new step, run `git pull` and skim recent commit messages —
  the other machine may have moved ahead.

## Working agreements with the user

- Build strictly in the spec's order. Don't skip ahead, even if you see a
  tempting refactor.
- After finishing a step, summarize what changed and **wait** for verification.
  Don't auto-start the next step.
- All matching is client-side. Any change that would send user inputs over the
  network needs explicit sign-off.
- Don't add analytics, telemetry, or external scripts without asking.
