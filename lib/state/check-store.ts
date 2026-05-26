"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Sex } from "@/lib/vaers/types";

/**
 * In-progress check draft.
 *
 * Persisted to sessionStorage so a refresh mid-flow doesn't wipe the
 * user's inputs, but cleared when they close the tab. All dates are
 * YYYY-MM-DD strings (matches `<input type="date">` output); convert
 * to local Date via `localDateFromIso()` before calling findMatches.
 */
export interface CheckDraftState {
  state: string | null;
  sex: Sex | null;
  dob: string | null;
  /** 1+ dose dates as YYYY-MM-DD strings. Starts empty. */
  doseDates: string[];

  setState: (state: string) => void;
  setSex: (sex: Sex) => void;
  setDob: (dob: string) => void;
  setDoseDates: (doses: string[]) => void;
  reset: () => void;
}

const initial: Pick<
  CheckDraftState,
  "state" | "sex" | "dob" | "doseDates"
> = {
  state: null,
  sex: null,
  dob: null,
  doseDates: [],
};

export const useCheckDraft = create<CheckDraftState>()(
  persist(
    (set) => ({
      ...initial,
      setState: (state) => set({ state }),
      setSex: (sex) => set({ sex }),
      setDob: (dob) => set({ dob }),
      setDoseDates: (doseDates) => set({ doseDates }),
      reset: () => set({ ...initial }),
    }),
    {
      name: "checkvaers:draft",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : window.sessionStorage
      ),
    }
  )
);
