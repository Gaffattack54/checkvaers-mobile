"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckDraft } from "@/lib/state/check-store";
import {
  StepHeader,
  CHECK_FLOW_STEPS,
} from "@/components/check-flow/step-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dobSchema } from "@/lib/validation/schemas";
import { ageInYears, todayIso } from "@/lib/vaers/dates";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

export default function DobStepPage() {
  const router = useRouter();
  const stored = useCheckDraft((s) => s.dob);
  const setDob = useCheckDraft((s) => s.setDob);

  const [value, setValue] = useState(stored ?? "");
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    if (!value) return null;
    const result = dobSchema.safeParse(value);
    if (!result.success) return null;
    return { iso: value, age: ageInYears(value) };
  }, [value]);

  const handleContinue = () => {
    const result = dobSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid date.");
      return;
    }
    setDob(value);
    router.push("/check/doses");
  };

  return (
    <div className={isSite ? "flex flex-1 flex-col px-2 py-2 md:px-0 md:py-4" : "flex flex-1 flex-col px-6 pb-32"}>
      <StepHeader
        step={2}
        total={CHECK_FLOW_STEPS}
        title="When were you born?"
        subtitle="We use this to calculate your age — VAERS records only store age, not date of birth."
        onBack={() => router.push("/check/sex")}
      />

      <div className="mt-8 space-y-2">
        <label htmlFor="dob" className="text-sm font-medium text-brand-navy">
          Date of birth
        </label>
        <Input
          id="dob"
          type="date"
          value={value}
          max={todayIso()}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          inputMode="numeric"
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : parsed ? (
          <p className="text-sm text-muted-foreground">
            You are <span className="font-semibold text-brand-navy">{parsed.age}</span>{" "}
            year{parsed.age === 1 ? "" : "s"} old.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tap to open your phone&apos;s date picker.
          </p>
        )}
      </div>

      <div className="mt-auto pt-10">
        <Button
          size="lg"
          className="w-full"
          disabled={!parsed}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
