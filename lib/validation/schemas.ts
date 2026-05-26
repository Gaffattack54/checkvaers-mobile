import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Two-letter USPS state code. */
export const stateCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, "Pick a state.");

/** VAERS-style sex value. */
export const sexSchema = z.enum(["M", "F", "U"], {
  message: "Choose Male, Female, or Unknown.",
});

/** YYYY-MM-DD date string. Validated at the form layer, not the matcher. */
export const isoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, "Use the date picker.");

/** Date of birth: must be in the past and within plausible range. */
export const dobSchema = isoDateSchema.refine(
  (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dob = new Date(y, m - 1, d);
    const now = new Date();
    if (Number.isNaN(dob.getTime())) return false;
    if (dob > now) return false;
    // Cap at 130 years old.
    const minYear = now.getFullYear() - 130;
    return y >= minYear;
  },
  { message: "Enter a valid date of birth." }
);

/** Dose date list: 1–5 entries, each a YYYY-MM-DD, no duplicates. */
export const doseDatesSchema = z
  .array(isoDateSchema)
  .min(1, "Add at least one vaccination date.")
  .max(5, "You can add up to 5 dose dates.")
  .refine((arr) => new Set(arr).size === arr.length, {
    message: "Dose dates can't repeat.",
  });

/** Full check draft, used for the review step and matcher invocation. */
export const checkDraftSchema = z.object({
  state: stateCodeSchema,
  sex: sexSchema,
  dob: dobSchema,
  doseDates: doseDatesSchema,
});

export type CheckDraft = z.infer<typeof checkDraftSchema>;
