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
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

const OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: "F", label: "Female" },
  { value: "M", label: "Male" },
  { value: "U", label: "Prefer not to say" },
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
    <div className={isSite ? "mx-auto flex w-full max-w-xl flex-1 flex-col" : "flex flex-1 flex-col px-6 pb-32"}>
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
                "flex w-full items-center justify-between rounded-2xl border-2 bg-card px-5 py-5 text-left min-h-[64px] shadow-sm transition-all",
                isSelected
                  ? "border-brand-cyan bg-brand-cyan/5 ring-2 ring-brand-cyan/20"
                  : "border-transparent shadow-card hover:border-border hover:bg-accent/40"
              )}
            >
              <span className="text-base font-semibold text-brand-navy">
                {opt.label}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-brand-cyan bg-brand-cyan text-white"
                    : "border-border bg-background"
                )}
                aria-hidden="true"
              >
                {isSelected ? <Check className="h-4 w-4" /> : null}
              </span>
            </button>
          );
        })}
      </fieldset>
      <p className="mt-3 text-xs text-muted-foreground">
        VAERS records use these values (M / F / U). Pick the one most
        likely to appear in your report.
      </p>

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
