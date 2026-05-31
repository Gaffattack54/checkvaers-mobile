"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useCheckDraft } from "@/lib/state/check-store";
import {
  StepHeader,
  CHECK_FLOW_STEPS,
} from "@/components/check-flow/step-header";
import { Button } from "@/components/ui/button";
import { checkDraftSchema } from "@/lib/validation/schemas";
import { findStateByCode } from "@/lib/vaers/us-states";
import { ageInYears, formatLongDate } from "@/lib/vaers/dates";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

const SEX_LABELS = { F: "Female", M: "Male", U: "Prefer not to say" } as const;

export default function ReviewStepPage() {
  const router = useRouter();
  const draft = useCheckDraft();

  const parsed = useMemo(() => {
    const result = checkDraftSchema.safeParse({
      state: draft.state,
      sex: draft.sex,
      dob: draft.dob,
      doseDates: draft.doseDates,
    });
    return result.success ? result.data : null;
  }, [draft.state, draft.sex, draft.dob, draft.doseDates]);

  const stateName = parsed ? findStateByCode(parsed.state)?.name : null;
  const age = parsed ? ageInYears(parsed.dob) : null;

  return (
    <div className={isSite ? "mx-auto flex w-full max-w-2xl flex-1 flex-col" : "flex flex-1 flex-col px-6 pb-32"}>
      <StepHeader
        step={4}
        total={CHECK_FLOW_STEPS}
        title="Review your details"
        subtitle="Tap any row to change it. Nothing is sent anywhere — matching happens on your device."
        onBack={() => router.push("/check/doses")}
      />

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
        <ReviewRow
          label="State"
          value={stateName ?? (draft.state ? draft.state : "—")}
          href="/check/state"
        />
        <ReviewRow
          label="Sex"
          value={draft.sex ? SEX_LABELS[draft.sex] : "—"}
          href="/check/sex"
        />
        <ReviewRow
          label="Date of birth"
          value={
            draft.dob
              ? `${formatLongDate(draft.dob)}${age != null ? ` · age ${age}` : ""}`
              : "—"
          }
          href="/check/dob"
        />
        <ReviewRow
          label={`Vaccine dose${draft.doseDates.length === 1 ? "" : "s"}`}
          value={
            draft.doseDates.length === 0
              ? "—"
              : draft.doseDates.map(formatLongDate).join(" · ")
          }
          href="/check/doses"
        />
      </ul>

      {!parsed ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Fill in any missing rows above before running the check.
        </p>
      ) : null}

      <div className="mt-auto pt-10">
        <Button
          size="lg"
          className="w-full"
          disabled={!parsed}
          onClick={() => router.push("/check/result")}
        >
          Check VAERS
        </Button>
        <p className="mt-3 text-balance text-center text-xs text-muted-foreground">
          Searches publicly available VAERS data. Not a medical diagnostic tool.
        </p>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 px-4 py-4 min-h-tap hover:bg-accent/30"
      >
        <span className="min-w-0">
          <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-base text-brand-navy">
            {value}
          </span>
        </span>
        <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}
