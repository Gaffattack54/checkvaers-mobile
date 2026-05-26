"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useCheckDraft } from "@/lib/state/check-store";
import {
  StepHeader,
  CHECK_FLOW_STEPS,
} from "@/components/check-flow/step-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Sex } from "@/lib/vaers/types";

const OPTIONS: Array<{ value: Sex; label: string; helper: string }> = [
  { value: "F", label: "Female", helper: "VAERS sex = F" },
  { value: "M", label: "Male", helper: "VAERS sex = M" },
  { value: "U", label: "Prefer not to say", helper: "VAERS sex = U" },
];

export default function SexStepPage() {
  const router = useRouter();
  const selected = useCheckDraft((s) => s.sex);
  const setSex = useCheckDraft((s) => s.setSex);
  const stateCode = useCheckDraft((s) => s.state);

  const handleNext = () => {
    if (selected) router.push("/check/dob");
  };

  return (
    <div className="flex flex-1 flex-col px-6 pb-32">
      <StepHeader
        step={1}
        total={CHECK_FLOW_STEPS}
        title="What sex was reported?"
        subtitle="VAERS records use this value (Male / Female / Unknown)."
        onBack={() => router.push("/check/state")}
      />

      {!stateCode ? (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Heads up — go back and pick a state first.
        </p>
      ) : null}

      <fieldset className="mt-8 space-y-3" aria-label="Sex">
        <legend className="sr-only">Sex</legend>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSex(opt.value)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border bg-card px-5 py-4 text-left min-h-tap shadow-sm transition-colors",
                isSelected
                  ? "border-brand-cyan ring-2 ring-brand-cyan/40"
                  : "border-border hover:bg-accent/40"
              )}
            >
              <span>
                <span className="block text-base font-semibold text-brand-navy">
                  {opt.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {opt.helper}
                </span>
              </span>
              {isSelected ? (
                <Check
                  className="h-6 w-6 text-brand-cyan"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </fieldset>

      <div className="mt-auto pt-10">
        <Button
          size="lg"
          className="w-full"
          disabled={!selected}
          onClick={handleNext}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
