# MIGRATION.md — Swapping the on-device dataset for a hosted API

CheckVAERS today does all matching client-side against a static gzipped
JSON snapshot. When the client is ready to point this at their
production API, the swap is small and well-contained. This doc explains
exactly what changes.

## TL;DR

- The whole data layer hides behind `lib/vaers/data-loader.ts` and
  `lib/vaers/matcher.ts`.
- The result page (`app/(tabs)/check/result/page.tsx`) is the only
  consumer.
- For a remote API: replace `useVaersData()` + the local matcher call
  with a single `useMatchQuery(input)` hook that POSTs to your endpoint
  and returns the same `MatchResult`.
- Storage tables (history, report drafts) stay local — there's nothing
  to migrate.

## Suggested API contract

```ts
POST /api/v1/match
Content-Type: application/json

// Request body
{
  state:         string;   // 2-letter USPS code
  sex:           "M" | "F" | "U";
  ageYears:      number;
  vaccineDates:  string[]; // ISO date strings: "YYYY-MM-DD"
}

// 200 Response body — same shape as lib/vaers/types.ts → MatchResult
{
  exact:     VaersRecord[];   // see lib/vaers/types.ts
  potential: VaersRecord[];   // capped at 20, sorted by closeness
  none:      boolean;
  metadata?: {
    datasetGeneratedAt: string;
    datasetYearStart:   number;
    datasetYearEnd:     number;
    matcherVersion:     string;
  };
}
```

The existing `VaersRecord` shape in `lib/vaers/types.ts` is what the UI
expects. If the production API can return that shape directly, no
adapter is needed.

## Files to change

### 1. `lib/vaers/data-loader.ts` — gut or delete

This hook today downloads + caches the snapshot. In an API world, you
don't pre-fetch a dataset — each check is its own request. Replace the
hook with one that just reports "API reachable / not reachable" if you
need a readiness check, or delete it outright if your matcher hook
handles connectivity errors directly.

### 2. New: `lib/vaers/api-matcher.ts`

Wrap your POST in a typed hook. If you want to use TanStack Query
(already installed, currently unused), this is a one-liner:

```ts
"use client";
import { useQuery } from "@tanstack/react-query";
import type { MatchInput, MatchResult } from "./types";
import { isoFromLocalDate } from "./dates";

export function useMatchQuery(input: MatchInput | null) {
  return useQuery({
    enabled: !!input,
    queryKey: ["match", input],
    queryFn: async () => {
      if (!input) throw new Error("no input");
      const res = await fetch("/api/v1/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: input.state,
          sex: input.sex,
          ageYears: input.ageYears,
          vaccineDates: input.vaccineDates.map(isoFromLocalDate),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as MatchResult;
    },
  });
}
```

Mount `QueryClientProvider` once in `app/layout.tsx` (a 10-line
provider) — TanStack Query is already in `package.json` for exactly
this future.

### 3. `app/(tabs)/check/result/page.tsx` — swap the source of `result`

Today the page:

```ts
const loader = useVaersData();
// ...wait for loader.kind === "ready"...
const result = findMatches(input, loader.data.records);
```

After:

```ts
const { data: result, isLoading, error } = useMatchQuery(input);
```

The rest of the page (the `ExactMatchCard` / `PotentialMatchesList` /
`NoMatchCard` branching, the auto-save to `checksRepo`, the
loading-state component) doesn't change.

### 4. `lib/vaers/matcher.ts` — keep for tests, optionally retire

The matcher's behavior becomes server-side. The current implementation
can stay as a reference for the API to replicate, and the existing
Vitest suite (`lib/vaers/__tests__/matcher.test.ts`) is a free
specification you can port to the backend.

If you want to drop client-side matching entirely, remove the
`findMatches` import from the result page and delete the matcher tests
(or rewrite them as contract tests against the API).

### 5. `lib/storage/db.ts` — drop the `dataCache` table

Once you're API-backed, the `dataCache` Dexie table is dead code. Bump
the schema to v3 (omit `dataCache`) and remove `dataCacheRepo`. The
existing `checks` and `reports` tables stay — they hold local user
state that has no server equivalent.

### 6. Env: `NEXT_PUBLIC_VAERS_DATA_URL` → `NEXT_PUBLIC_API_URL`

Replace the snapshot URL var with a base URL for the API host. Update
`.env.example`, README's "Refreshing the VAERS data snapshot" section,
and any Vercel project settings.

### 7. Service worker

If the API is on a different origin and you still want offline matching,
the service worker (`public/sw.js`) needs an update — the current
strategies assume a same-origin app shell and one VAERS data file. With
an API:

- Same-origin app shell strategy stays the same.
- Per-request match POSTs should **not** be cached (matches are derived
  from user input).
- Consider a cache-and-revalidate strategy for any read-only reference
  endpoints (e.g. US-states list, vaccine manufacturers).

If offline matching isn't a requirement of the production product, you
can simplify by deleting the VAERS-specific cache rules entirely.

## What stays the same

- The whole UX — check flow, review, result screens, history,
  report tab, learn tab, privacy page.
- The bottom-tab navigation.
- All Tailwind/shadcn primitives.
- The Zustand draft store, Dexie history/report tables.
- The matcher contract (`MatchInput` / `MatchResult` shapes) — keep this
  stable across the swap so the UI doesn't need re-plumbing.

## Suggested rollout

1. Stand up the API with the contract above. Use the matcher tests as
   conformance criteria.
2. Add a `useMatchQuery` hook that toggles between API and the existing
   client matcher via an env flag — lets you A/B test in a deploy.
3. Once parity is verified, delete `lib/vaers/data-loader.ts`,
   `lib/vaers/mock-data.ts`, and the `dataCache` Dexie store.
4. Ship.

If the API later supports a "did the user already report this?"
endpoint, that's a clean addition to `useMatchQuery`'s response and
won't perturb the existing UI.
