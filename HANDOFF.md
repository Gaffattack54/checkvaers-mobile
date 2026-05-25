# Handoff: CheckVAERS, picking up on a second device

Read this once when you sit down at a new machine. It tells you what's
going on, what's already done, and how to resume. The full spec is in
[`SPEC.md`](./SPEC.md). The Claude Code project memory is in
[`CLAUDE.md`](./CLAUDE.md).

---

## TL;DR

- **Project:** Mobile-first PWA that replicates checkvaers.com. Lets users
  check whether a COVID-19 adverse event matching their details has been
  reported to VAERS. All matching happens on-device — no PII leaves the phone.
- **Stack:** Next.js 14 (App Router, TS, no `src/`) + Tailwind + shadcn/ui +
  Dexie + next-pwa. Full list in `CLAUDE.md`.
- **Brand:** cyan `#29C5F6`, navy `#0B1B3B`, Inter font, pill buttons,
  48px tap targets, `rounded-2xl` cards.
- **Repo:** `Gaffattack54/checkvaers-mobile` (private). Branch: `main`.
- **Where we are:** Step 1 of 13 done and committed. Step 2 (bottom tab
  nav) is next.

---

## First thing to do on a new device

```bash
gh repo clone Gaffattack54/checkvaers-mobile
cd checkvaers-mobile
npm install
```

Then open the folder in Claude Code. It auto-loads `CLAUDE.md`.

**Before starting work, always:** `git pull`
**Before walking away, always:** `git add -A && git commit -m "..." && git push`

---

## Kickoff prompt for Claude Code on the other device

Paste this verbatim into Claude Code as the first message of a new session:

> I'm picking up the CheckVAERS build on a second machine. Read `HANDOFF.md`,
> `CLAUDE.md`, and `SPEC.md` in this repo. Confirm you know:
> (1) what the project is, (2) the non-negotiable tech stack, (3) the
> brand tokens, (4) which build step is next per `CLAUDE.md`, and (5) our
> working agreement (build in spec order, stop after each step, no
> analytics/telemetry without asking, all matching is client-side).
>
> Don't start coding yet — give me a 5-line status summary first and wait
> for me to say go.

That bootstraps the other session to the same context this one had.

---

## What's done so far (Step 1)

Scaffold + theme. Specifically:

- Next.js 14 project at repo root (no `src/`, App Router, TypeScript, Tailwind)
- `tailwind.config.ts` extended with brand tokens (`brand-cyan`, `brand-navy`),
  shadcn HSL CSS-variable tokens, `min-h-tap` (48px), `shadow-card`,
  `bg-hex-pattern`
- `app/globals.css` with HSL token definitions, iOS form-zoom fix,
  safe-area helpers (`pt-safe`, `pb-safe`), `prefers-reduced-motion` guard
- `components.json` for shadcn (so the CLI works on either machine if needed)
- `lib/utils.ts` with `cn()` helper
- `components/ui/button.tsx` — shadcn-style Button. Variants: `default` (cyan),
  `secondary` (navy), `outline`, `ghost`, `destructive`, `link`. Sizes
  default to 48px height.
- `app/layout.tsx` — Inter font via `next/font/google`, PWA metadata,
  iOS Apple Web App meta, theme color `#29C5F6`
- `app/page.tsx` — branded landing page (placeholder; will be replaced
  by the bottom-tab shell in Step 2)
- `public/patterns/hex.svg` — low-opacity hex background pattern
- Empty dirs (with `.gitkeep`) for `components/check-flow`, `components/result-cards`,
  `components/shared`, `lib/vaers`, `lib/storage`, `lib/validation`
- `.env.example` with `NEXT_PUBLIC_VAERS_DATA_URL` documented
- `.claude/settings.json` — shared permission allowlist (npm/git/next/docs);
  denies `rm -rf`, force-pushes, hard resets
- `.gitignore` updated to exclude `.claude/settings.local.json`

**Verified:** `npm run build` passes (compiled successfully, 5 static pages,
~96 KB First Load JS on `/`).

---

## What's next (Step 2)

**Bottom tab navigation shell with 4 placeholder screens.**

Per the spec:

- `BottomTabs` component in `components/shared/`
- Routes: `/check` (default), `/learn`, `/report`, `/history`
- The four tabs render placeholder content for now — they get filled in
  during Steps 5–9
- The tab bar should be fixed to the bottom, respect iOS safe area
  (`pb-safe`), use lucide-react icons, highlight the active tab in cyan,
  and meet 48px tap-target minimum

Then **stop and let the user verify** before Step 3.

---

## Full build order (13 steps)

Live checklist is in `CLAUDE.md` — update it as steps complete.

1. ✅ Scaffold + Tailwind + shadcn + theme tokens
2. ⏭ Bottom tab navigation shell (4 placeholder screens) ← **next**
3. Mock VAERS data (50 records) in `lib/vaers/mock-data.ts`
4. Matching logic in `lib/vaers/matcher.ts` + unit tests
5. Check flow (steps 1–7 of the UX) wired to mock data
6. Result screens (`ExactMatchCard`, `PotentialMatchesList`, `NoMatchCard`)
7. Learn tab content (5 expandable educational cards)
8. Report tab flow (checklist + deep link to vaers.hhs.gov/reportevent.html)
9. History tab + Dexie (IndexedDB) integration
10. Real data pipeline: `scripts/prepare-vaers-data.ts` + R2 download + cache
11. PWA: manifest, icons (192/256/384/512), service worker, offline support
12. Polish: animations, empty states, error recovery, a11y pass
13. README + MIGRATION.md

---

## Working agreements with the user

- **Build strictly in spec order.** Don't skip ahead, even for tempting refactors.
- **Stop after every step.** Summarize what changed and wait for verification.
  Don't auto-start the next step.
- **Client-side only.** Any change that would send user inputs over the
  network needs explicit sign-off. Privacy is the product.
- **No analytics or telemetry** without asking first. Plausible is allowed
  but must remain opt-in / off by default.
- **Don't swap the non-negotiable stack** (Next 14, Tailwind, shadcn, Dexie,
  RHF+Zod, TanStack Query, Zustand, Papaparse, next-pwa) without asking.

---

## Cross-device gotchas

- **`TaskCreate` task lists are session-scoped.** They don't sync. The
  checklist in `CLAUDE.md` is the cross-device source of truth — re-create
  Claude Code tasks from the unchecked items at session start if you want
  progress tracking.
- **`.env.local` is gitignored.** Not relevant yet (still on mock data); once
  Step 10 sets up `NEXT_PUBLIC_VAERS_DATA_URL`, copy from `.env.example` on
  each device.
- **Line-ending warnings** (LF→CRLF) on Windows commits are noise — ignore.
- **`.claude/settings.json` is committed** (shared permissions). Use
  `.claude/settings.local.json` for per-user overrides — it's gitignored.

---

## Useful commands

```bash
npm run dev      # http://localhost:3000
npm run build    # production build — run before declaring a step done
npm run start    # serve the production build
```

No lint script yet — we scaffolded with `--no-eslint`. We can add Vitest
when Step 4 needs it.
