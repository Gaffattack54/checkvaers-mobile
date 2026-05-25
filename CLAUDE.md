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
- [ ] **2.** Bottom tab navigation shell (4 placeholder screens) ← **next**
- [ ] **3.** Mock VAERS data (50 records)
- [ ] **4.** Matching logic + unit tests
- [ ] **5.** Check flow (steps 1–7) wired to mock data
- [ ] **6.** Result screens (exact / potential / none)
- [ ] **7.** Learn tab content
- [ ] **8.** Report tab flow
- [ ] **9.** History tab + IndexedDB
- [ ] **10.** Real data pipeline (`prepare-vaers-data.ts` + R2 + cache)
- [ ] **11.** PWA (manifest, icons, service worker, offline)
- [ ] **12.** Polish (animations, empty/error states, a11y)
- [ ] **13.** README + MIGRATION.md

When you finish a step, tick the box here and commit.

## Commands

```
npm run dev      # start dev server (http://localhost:3000)
npm run build    # production build — run before declaring a step done
npm run start    # serve the production build
```

No lint script wired up yet (we scaffolded with `--no-eslint`).

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
