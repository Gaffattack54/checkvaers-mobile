"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useCheckDraft } from "@/lib/state/check-store";
import {
  StepHeader,
  CHECK_FLOW_STEPS,
} from "@/components/check-flow/step-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { doseDatesSchema } from "@/lib/validation/schemas";
import { todayIso } from "@/lib/vaers/dates";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

const MAX_DOSES = 5;

export default function DosesStepPage() {
  const router = useRouter();
  const stored = useCheckDraft((s) => s.doseDates);
  const setDoseDates = useCheckDraft((s) => s.setDoseDates);

  // Local working copy; commits to store on Continue.
  const [doses, setDoses] = useState<string[]>(
    stored.length > 0 ? stored : [""]
  );
  const [error, setError] = useState<string | null>(null);

  const updateDose = (i: number, value: string) => {
    setDoses((arr) => arr.map((d, idx) => (idx === i ? value : d)));
    setError(null);
  };

  const addDose = () => {
    if (doses.length >= MAX_DOSES) return;
    setDoses((arr) => [...arr, ""]);
  };

  const removeDose = (i: number) => {
    setDoses((arr) =>
      arr.length === 1 ? arr : arr.filter((_, idx) => idx !== i)
    );
    setError(null);
  };

  const handleContinue = () => {
    const cleaned = doses.map((d) => d.trim()).filter(Boolean);
    const result = doseDatesSchema.safeParse(cleaned);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your dose dates.");
      return;
    }
    setDoseDates(cleaned);
    router.push("/check/review");
  };

  return (
    <div className={isSite ? "mx-auto flex w-full max-w-xl flex-1 flex-col" : "flex flex-1 flex-col px-6 pb-32"}>
      <StepHeader
        step={3}
        total={CHECK_FLOW_STEPS}
        title="When did you receive your COVID-19 vaccine(s)?"
        subtitle="Add each dose, including boosters. Up to five."
        onBack={() => router.push("/check/dob")}
      />

      <div className="mt-6 space-y-3">
        {doses.map((dose, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label
                htmlFor={`dose-${i}`}
                className="text-sm font-medium text-brand-navy"
              >
                Dose {i + 1}
              </label>
              <Input
                id={`dose-${i}`}
                type="date"
                value={dose}
                max={todayIso()}
                onChange={(e) => updateDose(i, e.target.value)}
                inputMode="numeric"
              />
            </div>
            <button
              type="button"
              onClick={() => removeDose(i)}
              disabled={doses.length === 1}
              aria-label={`Remove dose ${i + 1}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ))}

        {doses.length < MAX_DOSES ? (
          <button
            type="button"
            onClick={addDose}
            className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-brand-cyan hover:bg-brand-cyan/10"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add another dose
          </button>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-10">
        <Button size="lg" className="w-full" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
