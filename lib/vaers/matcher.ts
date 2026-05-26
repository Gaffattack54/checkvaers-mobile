import type { MatchInput, MatchResult, VaersRecord } from "./types";

/** Maximum number of potential matches surfaced to the UI. */
export const POTENTIAL_MATCH_LIMIT = 20;

interface Thresholds {
  /** Inclusive maximum |ageDelta| in years. */
  ageYears: number;
  /** Inclusive maximum |dateDelta| in days. */
  dateDays: number;
}

const EXACT: Thresholds = { ageYears: 1, dateDays: 7 };
const POTENTIAL: Thresholds = { ageYears: 5, dateDays: 30 };

/**
 * Extract a calendar-day key (YYYY-MM-DD) from a Date using its local fields.
 *
 * We intentionally read local accessors — when the check form turns an
 * `<input type="date">` value into a Date for matching, the form layer should
 * construct it via `new Date(y, m-1, d)` (local midnight). This function
 * mirrors that contract: the user's "June 1" stays "June 1" regardless of
 * the device's timezone.
 *
 * (Avoids the trap where `new Date("2022-06-01")` parses as UTC midnight
 * and drifts to the previous calendar day in negative-offset timezones.)
 */
function dateKeyFromLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Absolute day delta between two YYYY-MM-DD strings. */
function daysBetweenKeys(a: string, b: string): number {
  const aMs = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const bMs = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.abs(Math.round((aMs - bMs) / 86_400_000));
}

/**
 * Returns the smallest absolute day delta between the user's vaccine doses
 * and the given record's vax_date. Infinity when the user has no dose dates
 * (caller should treat as a non-match).
 */
function minDayDelta(record: VaersRecord, userDates: Date[]): number {
  if (userDates.length === 0) return Infinity;
  let best = Infinity;
  for (const d of userDates) {
    const delta = daysBetweenKeys(record.vaxDate, dateKeyFromLocal(d));
    if (delta < best) best = delta;
  }
  return best;
}

function ageDelta(record: VaersRecord, userAge: number): number {
  return Math.abs(record.ageYears - userAge);
}

function fieldsMatch(record: VaersRecord, input: MatchInput): boolean {
  return record.state === input.state && record.sex === input.sex;
}

function withinThresholds(
  record: VaersRecord,
  input: MatchInput,
  thresholds: Thresholds
): boolean {
  if (!fieldsMatch(record, input)) return false;
  if (ageDelta(record, input.ageYears) > thresholds.ageYears) return false;
  if (minDayDelta(record, input.vaccineDates) > thresholds.dateDays) {
    return false;
  }
  return true;
}

/**
 * Find VAERS records matching the user's inputs.
 *
 * Buckets:
 *  - `exact`     — same state, same sex, age within ±1 yr, any vaccine date within ±7 days
 *  - `potential` — same state, same sex, age within ±5 yrs, any vaccine date within ±30 days
 *                  (exact matches are excluded; sorted by closeness; capped at 20)
 *  - `none`      — true when both buckets are empty
 *
 * Matching is intentionally generous on the "potential" tier and strict on
 * the "exact" tier — the goal is to flag plausible candidates for the user
 * to review without producing false-confident "we found YOUR report" claims.
 */
export function findMatches(
  input: MatchInput,
  records: readonly VaersRecord[] = []
): MatchResult {
  const exact: VaersRecord[] = [];
  const potentialCandidates: Array<{
    record: VaersRecord;
    score: number;
  }> = [];

  for (const record of records) {
    if (withinThresholds(record, input, EXACT)) {
      exact.push(record);
      continue;
    }
    if (withinThresholds(record, input, POTENTIAL)) {
      const score =
        ageDelta(record, input.ageYears) +
        minDayDelta(record, input.vaccineDates);
      potentialCandidates.push({ record, score });
    }
  }

  // Sort potentials by combined closeness (smaller = closer), then cap.
  potentialCandidates.sort((a, b) => a.score - b.score);
  const potential = potentialCandidates
    .slice(0, POTENTIAL_MATCH_LIMIT)
    .map((c) => c.record);

  return {
    exact,
    potential,
    none: exact.length === 0 && potential.length === 0,
  };
}
