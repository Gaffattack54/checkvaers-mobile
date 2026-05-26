/**
 * Date utilities used by the check flow.
 *
 * The matcher (lib/vaers/matcher.ts) requires user-supplied dates to be
 * *local-midnight* Date objects so that the user's "June 1" stays
 * "June 1" regardless of the device's timezone. The naive
 * `new Date("2022-06-01")` parses as UTC midnight and drifts to the
 * previous calendar day in negative-offset timezones; use these helpers
 * to avoid that trap.
 */

/** Parse a YYYY-MM-DD string into a local-midnight Date. */
export function localDateFromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Serialize a Date to YYYY-MM-DD using its local fields. */
export function isoFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute age in whole years from a YYYY-MM-DD birthdate, as of `today`
 * (defaults to "now" in local time).
 */
export function ageInYears(birthIso: string, today: Date = new Date()): number {
  const dob = localDateFromIso(birthIso);
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthdayThisYear =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age;
}

/** Today's date in YYYY-MM-DD (local). Useful as a `max` attribute on date inputs. */
export function todayIso(now: Date = new Date()): string {
  return isoFromLocalDate(now);
}

/** Convenience: format a YYYY-MM-DD as e.g. "March 12, 2021". */
export function formatLongDate(iso: string): string {
  const d = localDateFromIso(iso);
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
