# CheckVAERS — clinician brief

*An on-device search interface to the public VAERS COVID-19 dataset.*

---

**In one sentence.** CheckVAERS lets a patient (or anyone) check whether a
VAERS report matching their state, sex, age at vaccination, and dose date(s)
exists in HHS's public COVID-19 adverse-event dataset — without
transmitting any of that information to a server.

**Status.** Live in production.
- Site: <https://checkvaers-site.vercel.app>
- App (PWA): <https://check-vaers.vercel.app>
- Source: <https://github.com/Gaffattack54/checkvaers-mobile>

---

## Why this exists

The public VAERS dataset is published as ~700 MB of CSVs at
[vaers.hhs.gov/data/datasets.html](https://vaers.hhs.gov/data/datasets.html).
A patient who asks *"is my report in there?"* has no reasonable path to
that workflow, and the official lookup tool (CDC WONDER) is desktop-only
and not built for one-off self-queries.

CheckVAERS is a focused interface over the same dataset: four questions,
on-device matching, and a result page that either surfaces matching
VAERS_IDs or honestly says *no match — here are the partial matches to
review.*

---

## Data

| | |
|---|---|
| **Source** | vaers.hhs.gov public CSV exports (`VAERSDATA`, `VAERSVAX`, `VAERSSYMPTOMS`) |
| **Coverage** | 2020 – 2025 |
| **Filter** | `VAX_TYPE = "COVID19"` with a valid `VAX_DATE` |
| **Records** | **889,521** |
| **Manufacturer split** | Pfizer/BioNTech 47% · Moderna 46% · Janssen 6% · Novavax <1% · Unknown <1% |
| **Refresh cadence** | Manual re-prep against the latest published CSVs; current snapshot is tagged `v0.1.1-data` |
| **De-identification** | Performed upstream by HHS per the HIPAA Privacy Rule §164.514(b) Safe Harbor method before public release. CheckVAERS only ever consumes the already-de-identified version. |

The prepared snapshot is **15 MB gzipped (≈60 MB uncompressed)** and is
served same-origin via a Vercel edge proxy so the browser can fetch it
without cross-origin restrictions.

---

## Matching algorithm

**Input per check**
- `state` — USPS two-letter code
- `sex` — `M` / `F` / `U` (matches the VAERS schema)
- `dob` → integer `ageYears` at first dose
- `vaccineDates[]` — 1 to 5 dose dates (ISO `YYYY-MM-DD`)

**Output buckets**
- **Exact** — state and sex equal; `|ageDelta| ≤ 1 year`; **any** user dose
  date within ±7 days of the record's `VAX_DATE`.
- **Potential** — state and sex equal; `|ageDelta| ≤ 5 years`; any user
  dose date within ±30 days. Capped at 20, sorted ascending by
  combined age + date delta. Exact-bucket records are excluded.
- **None** — neither bucket has results.

Matching is stratified by a state-keyed index built once at data-load
time. Per-check latency on the full 900k-record dataset is **under 10 ms
on a phone CPU**, well below one frame.

---

## Privacy and regulatory posture

- **No PHI is processed.** The VAERS public dataset is de-identified by
  HHS before release; we read only that copy.
- **HIPAA does not attach.** CheckVAERS is a consumer-facing search tool,
  not a healthcare provider, health plan, or clearinghouse, and does not
  act as a business associate. The covered-entity obligations do not
  apply.
- **User inputs never leave the device.** State, sex, DOB, and dose dates
  are held in the browser only. Matching runs entirely client-side in
  JavaScript.
- **Local-only persistence.** Completed checks save to IndexedDB on the
  user's device. There is no server-side database.
- **HTTPS-only.** Data snapshot is ETag-validated on first launch and
  cached; subsequent checks run offline.
- **No accounts. No tracking. No analytics. No third-party scripts.**

The architecture is intentionally outside HIPAA scope. A reviewer asking
"how do you encrypt PHI at rest?" gets the more defensible answer:
*we do not store PHI in the first place.*

---

## UX flow

1. **State** — USPS dropdown, searchable
2. **Sex** — M / F / Prefer not to say
3. **Date of birth** — native date picker; computed age displayed inline
4. **Vaccine dose date(s)** — 1 to 5 entries; native date pickers
5. **Review** — single screen, every row deep-linked to its edit step
6. **Result** — *YES* / *MAYBE* / *NO* headline with the VAERS_ID list,
   manufacturer summary, and a CDC WONDER deep link to look up the full
   official report

The check flow auto-saves to `sessionStorage` for refresh resilience; a
completed check appears in a per-device History tab. The check flow
never identifies the user — only their device.

---

## Result detail and the trade-off we made

The prepared snapshot omits four fields that would otherwise inflate the
in-browser object graph past iOS Safari's per-tab memory budget:
`symptomText` (narrative), `recvDate`, `numDays`, and symptom codes 4–5.
What the result card shows: VAERS_ID, manufacturer, vaccination date,
state, age, top 3 coded symptoms, and a *View full report on CDC WONDER*
link by VAERS_ID. The full record (narrative, days-to-onset, treatment,
recovery status) is one click away at the canonical source.

This was a deliberate engineering choice: keep the browser memory budget
safe on a six-year-old iPhone, and let CDC WONDER serve as the
authoritative detail layer.

---

## What this is not

- Not medical advice. Not a diagnostic tool.
- Not a causation tool. **A VAERS match is a *report,* not a diagnosis.**
- Not a substitute for filing a VAERS report — the Report tab deep-links
  to <https://vaers.hhs.gov/reportevent.html> for that.
- Not affiliated with CDC, FDA, HHS, or any government agency.
- Not a real-time mirror of the live VAERS database. The snapshot lags.

---

## Technical architecture, one paragraph

Next.js 14 (App Router, TypeScript), deployed as two Vercel projects
from the same monorepo: a *site* build (rich marketing landing,
desktop-first responsive) and an *app* build (mobile-first PWA,
installable). The two share 100% of the functional code; a single
`NEXT_PUBLIC_VARIANT` env var selects the home-route presentation. The
client matcher is an in-browser state-indexed scan over records held in
memory. Persistence is Dexie over IndexedDB (check history + report
checklist + data cache). The dataset is prepared by a Node script
(`scripts/prepare-vaers-data.ts`) from the raw HHS year CSVs and
published as a GitHub Release asset; the client fetches it via a
same-origin `/api/vaers-data` Vercel route that follows the upstream
redirects server-side (release-assets.githubusercontent.com does not
send CORS headers, so a direct browser fetch would fail). Service worker
caches the app shell and the data file for offline use.

---

## Roadmap

**Near-term**
- Per-state lazy loading: the API endpoint returns only the user's
  state slice on demand, dropping the first-load payload from 15 MB to
  1–3 MB and removing the mobile memory ceiling entirely.
- Detail-on-demand: a `/api/vaers-detail/[id]` route restores the
  narrative, days-to-onset, and receive-date fields per match, without
  re-bloating the in-browser dataset.

**Medium-term**
- Coverage beyond COVID-19 (flu, MMR, HPV, etc.) using the same prep
  pipeline and matcher.
- A VICP / CICP eligibility flowchart on the Learn tab.
- Optional Plausible analytics (opt-in, privacy-respecting) for usage
  metrics.

**Open question**
- Whether a clinician-facing variant — full record fields client-side,
  desktop memory budget assumed — is worth a separate build.

---

## Links

- **Site (marketing):** <https://checkvaers-site.vercel.app>
- **App (PWA):** <https://check-vaers.vercel.app>
- **Source code:** <https://github.com/Gaffattack54/checkvaers-mobile>
- **Current data snapshot:** <https://github.com/Gaffattack54/checkvaers-mobile/releases/tag/v0.1.1-data>
- **Contact:** hello@checkvaers.app
