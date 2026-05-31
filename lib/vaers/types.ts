/**
 * VAERS data shape used throughout the app.
 *
 * Sourced from public VAERS CSVs (VAERSDATA + VAERSVAX + VAERSSYMPTOMS),
 * filtered to COVID-19 only, joined on VAERS_ID. See SPEC.md and
 * scripts/prepare-vaers-data.ts (added in Step 10).
 */

export type Sex = "M" | "F" | "U";

export type VaccineManufacturer =
  | "PFIZER\\BIONTECH"
  | "MODERNA"
  | "JANSSEN"
  | "NOVAVAX"
  | "UNKNOWN MANUFACTURER";

export interface VaersRecord {
  /** VAERS_ID — the official report ID. */
  vaersId: string;
  /** Two-letter US state code. */
  state: string;
  /** Patient sex. */
  sex: Sex;
  /** Age in years at time of vaccination. */
  ageYears: number;
  /** ISO date string (YYYY-MM-DD) — date the vaccine was given. */
  vaxDate: string;
  /** Vaccine manufacturer (VAERS uses these enumerated strings). */
  vaxManu: VaccineManufacturer | string;
  /** Coded symptom strings — typically up to 3 in the minimal dataset. */
  symptoms: string[];
  /**
   * Free-text narrative summary. **Optional** — dropped from the
   * v0.1.1+ minimal dataset to keep mobile-browser memory under control.
   * Mock data still includes it; production data does not.
   */
  symptomText?: string;
  /**
   * ISO date string — date the report was received by VAERS.
   * **Optional** — see note on `symptomText`.
   */
  recvDate?: string;
  /**
   * Days between vaccination and onset, if known.
   * **Optional** — see note on `symptomText`.
   */
  numDays?: number | null;
}

/* ------------------------------------------------------------------ */
/* Inputs and outputs of the matching engine                          */
/* ------------------------------------------------------------------ */

export interface MatchInput {
  /** Two-letter state code. */
  state: string;
  sex: Sex;
  /** Age in years at the time of the user's vaccinations. */
  ageYears: number;
  /** One or more vaccine dose dates (Date objects). */
  vaccineDates: Date[];
}

export interface MatchResult {
  /** All four fields match (age ±1 yr, any vaccine date ±7 days). */
  exact: VaersRecord[];
  /** State + sex match, age ±5 yrs, any vaccine date ±30 days. Capped at 20. */
  potential: VaersRecord[];
  /** Convenience flag — true if neither bucket has any records. */
  none: boolean;
}
