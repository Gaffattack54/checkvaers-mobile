# CheckVAERS Mobile Web App — Build Specification

You are building a mobile-first Progressive Web App (PWA) that replicates and
adapts checkvaers.com for mobile devices. The MVP is standalone — it does not
depend on the existing website's backend. Instead, it queries publicly available
VAERS data hosted as static CSV files. Later, this data layer will be swapped
for the client's production API.

## Tech Stack (non-negotiable choices)

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Hosting target:** Vercel (free tier) for the app, Cloudflare R2 or GitHub
  Releases for the CSV data files (free static hosting)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **State:** TanStack Query for data fetching/caching, Zustand for app state
- **Data parsing:** Papaparse for CSV streaming
- **Local storage:** IndexedDB via Dexie.js (for caching VAERS data + user history)
- **PWA:** next-pwa for service worker, manifest, offline support
- **Icons:** Lucide React
- **Date handling:** date-fns
- **Analytics (privacy-respecting):** Plausible (optional, off by default)

## Project Structure

```
/app
  /(check)
    /check          — multi-step check flow
    /result         — result screen
  /learn            — educational content
  /report           — guided report flow
  /history          — local user history
  layout.tsx        — root layout with bottom tab nav
  page.tsx          — landing/home
/components
  /ui               — shadcn primitives
  /check-flow       — step components for the check
  /result-cards     — exact match, potential match, no match cards
  /shared           — Header, BottomTabs, etc.
/lib
  /vaers
    data-loader.ts  — downloads/caches VAERS CSVs from R2
    matcher.ts      — matching logic (exact + fuzzy)
    types.ts        — VAERS data shape
  /storage
    db.ts           — Dexie schema (cached data + history)
  /validation
    schemas.ts      — Zod schemas for forms
/public
  /icons            — PWA icons (multiple sizes)
  manifest.json
```

## Visual Identity (match checkvaers.com)

- Primary cyan: `#29C5F6`
- Dark navy: `#0B1B3B`
- Background: white with subtle hexagonal pattern accent (SVG, low opacity)
- Headings: bold condensed sans (use Inter with tight tracking, font-black)
- Body: Inter regular
- Buttons: pill-shaped (`rounded-full`), primary cyan bg, white text, large
  tap targets (min 48px height)
- Cards: white, `rounded-2xl`, soft shadow (`shadow-md`)
- Match the existing site's tone: clinical, trustworthy, accessible

Configure Tailwind theme tokens accordingly.

## Data Layer: VAERS CSV Pipeline

VAERS publishes data as zipped CSV files at https://vaers.hhs.gov/data/datasets.html
The data is split into three files per year: VAERSDATA, VAERSVAX, VAERSSYMPTOMS.

**For the MVP:**

1. Create a `scripts/prepare-vaers-data.ts` Node script that:
   - Downloads VAERS data for the last 7 years (focus on COVID-19 vaccines only)
   - Joins the three CSVs on VAERS_ID
   - Filters to COVID-19 records only (VAX_TYPE = "COVID19")
   - Strips fields not needed for matching (keep: VAERS_ID, STATE, SEX,
     AGE_YRS, VAX_DATE, VAX_MANU, SYMPTOM_TEXT, RECVDATE, NUMDAYS, plus
     symptom columns)
   - Outputs a compressed JSON file (`vaers-covid-7yr.json.gz`) — should be
     under 50MB compressed
   - The script is run manually to refresh data; document this in README

2. Host the output file on Cloudflare R2 (free tier supports public reads)
   or as a GitHub Release asset. Document the URL in `.env.example` as
   `NEXT_PUBLIC_VAERS_DATA_URL`.

3. On first app launch:
   - Show a one-time "Downloading VAERS database" screen with progress bar
   - Stream-download and decompress the file
   - Store in IndexedDB indexed by [state, sex, age_yrs, vax_date]
   - Show "last updated" timestamp from the file's metadata
   - Subsequent launches: check for newer version (HEAD request, compare
     ETag), prompt to update if available, otherwise use cached data

4. All matching happens client-side. No PII ever leaves the device. This is
   a privacy feature, surface it in the UI.

## App Structure: 4 Bottom Tabs

### Tab 1: CHECK (default)

Multi-step flow, one input per screen, with progress dots at top:

**Step 1 — State**
- Searchable list of US states (use a bottom sheet or full screen on mobile)
- Store as 2-letter code

**Step 2 — Gender**
- Three buttons: Male / Female / Unknown (match VAERS schema: M/F/U)

**Step 3 — Date of birth**
- Native date input
- Convert to age in years for matching
- Show calculated age below: "You are X years old"

**Step 4 — Vaccine dose dates**
- "When did you receive your COVID-19 vaccine(s)?"
- Allow 1–5 dose date entries with add/remove buttons
- Native date inputs

**Step 5 — Review**
- Summary card of all inputs
- Edit button per row to jump back
- Big "Check VAERS" CTA

**Step 6 — Loading**
- Branded loader, "Searching VAERS database..."
- Run matching in a Web Worker so UI stays responsive

**Step 7 — Result screen**

Three possible states, each its own component:

- **`<ExactMatchCard>`** — green check icon, "Match found in VAERS."
  Shows VAERS ID, report date, symptoms summary. Tappable to expand
  full report details. CTA: "Share result" (uses Web Share API).

- **`<PotentialMatchesList>`** — header: "We found X reports that
  partially match your details. Tap each to review and identify if
  it's yours." List of cards showing state, age, vaccine date,
  manufacturer, symptoms preview. Each card expandable.

- **`<NoMatchCard>`** — clear, non-alarming explanation: "No reports
  matching your exact details were found in the VAERS database (last
  7 years of COVID-19 reports). This doesn't necessarily mean your
  provider failed to report — not all adverse events are on the
  mandatory reporting list, and the public VAERS dataset may lag the
  internal one." Primary CTA: "File a VAERS report yourself" → goes
  to Tab 3. Secondary: "Learn more about reporting" → Tab 2.

### Matching Logic (`lib/vaers/matcher.ts`)

```typescript
interface MatchInput {
  state: string;        // 2-letter code
  sex: 'M' | 'F' | 'U';
  ageYears: number;
  vaccineDates: Date[]; // 1+ dose dates
}

interface MatchResult {
  exact: VaersRecord[];      // all four fields match (age within ±1 yr,
                             // any vaccine date within ±7 days)
  potential: VaersRecord[];  // state + sex match, age within ±5 yrs,
                             // any vaccine date within ±30 days
  none: boolean;
}
```

Exact: state matches, sex matches, age within ±1 year, ANY vaccine date
within ±7 days of a VAERS VAX_DATE.

Potential: state matches, sex matches, age within ±5 years, ANY vaccine
date within ±30 days.

Cap potential matches at 20, sorted by closeness (smallest date delta +
age delta).

### Tab 2: LEARN

Card-based educational content. Each card expands inline. Content adapted
from the existing site:

1. **What is VAERS?** — plain language explanation
2. **Who is required to report?** — providers, manufacturers, and the
   distinction for COVID-19 vaccines (any event, regardless of causality)
   vs. other vaccines (specific reportable events list)
3. **Reportable Events for Non-COVID Vaccines** — display the official
   table (anaphylaxis timing, encephalopathy, etc.). Cite the source.
4. **The Vaccine Provider Agreement** — summary in plain English, link
   to the original PDF
5. **How current is this data?** — explain the 7-year window, COVID-only
   scope, last updated date, and the difference between this snapshot
   and the live VAERS database

Each card has a "View official source" link to the corresponding hhs.gov
or cdc.gov page.

### Tab 3: REPORT

Guided flow to help users file their own VAERS report (since VAERS does
not have an API for third-party submission, this is a deep-link helper):

1. **Checklist screen** — what you'll need:
   - Vaccine name, manufacturer, lot number
   - Date of vaccination
   - Symptoms and dates of onset
   - Healthcare provider info
   - Your contact information
2. **Tips screen** — best practices for filing
3. **"Open VAERS report form" button** — opens
   https://vaers.hhs.gov/reportevent.html in a new tab
4. **Save-for-later** — let users save their checklist progress to
   IndexedDB so they can come back

### Tab 4: HISTORY

Local-only history of checks performed on this device:
- List of past checks with date, inputs (anonymized in the list), result type
- Tap to view full result again
- Clear all history button
- Note at top: "History is stored only on your device. Clearing your
  browser data will remove it."

## PWA Configuration

- Generate a `manifest.json` with the app name "CheckVAERS", short_name
  "CheckVAERS", theme color `#29C5F6`, background `#FFFFFF`, display
  "standalone"
- Generate icon set (192, 256, 384, 512) — placeholder syringe/checkmark
  icon for now
- Service worker via next-pwa: cache app shell + VAERS data file
- Add iOS-specific meta tags for "Add to Home Screen" experience
- Offline support: app should work fully offline once data is downloaded

## Privacy & Security

- **No tracking by default.** No third-party analytics, no fingerprinting.
- **No PII transmitted.** All matching is client-side. Document this
  prominently in the UI and a `/privacy` page.
- IndexedDB data is local-only.
- HTTPS-only (Vercel handles this).
- Add a clear privacy policy page accessible from the footer of every tab.
- No cookies beyond functional ones.

## UX Details That Matter

- **Disclaimer banner** on first launch and on the result screen: "This
  tool searches publicly available VAERS data. It is not a medical
  diagnostic tool. Consult a healthcare provider for medical advice."
- **Scope disclosure** on the Check tab landing: "Searches COVID-19
  VAERS reports from the last 7 years."
- **Last-updated timestamp** visible somewhere persistent (footer or
  History tab)
- **Accessibility:** WCAG AA contrast, screen reader labels on all
  interactive elements, keyboard navigable, respects
  `prefers-reduced-motion`
- **Loading states** for every async operation
- **Error states** — network failure on initial data download must be
  recoverable (retry button)

## Deliverables

1. Full Next.js project, ready to `npm run dev`
2. The `scripts/prepare-vaers-data.ts` data prep script with clear
   instructions in README
3. README covering: setup, data refresh process, deployment to Vercel,
   PWA install instructions for end users
4. `.env.example` with all required env vars documented
5. A `MIGRATION.md` document explaining how to swap the local data
   layer for the future client API (which functions to change, what
   the API contract should look like)

## Build Order

Build in this order so I can test incrementally:

1. Project scaffold + Tailwind + shadcn setup + theme tokens
2. Bottom tab navigation shell with 4 placeholder screens
3. Mock VAERS data (50 hand-crafted records) in `lib/vaers/mock-data.ts`
   so the check flow is testable before the real data pipeline exists
4. Matching logic with unit tests against mock data
5. Check flow (steps 1-7) wired to mock data
6. Result screens (all 3 states)
7. Learn tab content
8. Report tab flow
9. History tab + IndexedDB integration
10. Real data pipeline: `prepare-vaers-data.ts` script + R2 download +
    cache layer
11. PWA configuration + offline support
12. Polish pass: animations, empty states, error handling
13. README + MIGRATION.md

After each major step, stop and let me verify before continuing.
