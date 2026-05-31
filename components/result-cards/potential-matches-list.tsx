"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { VaersRecord } from "@/lib/vaers/types";
import { formatLongDate } from "@/lib/vaers/dates";
import { findStateByCode } from "@/lib/vaers/us-states";
import { cn } from "@/lib/utils";

interface PotentialMatchesListProps {
  records: VaersRecord[];
}

export function PotentialMatchesList({ records }: PotentialMatchesListProps) {
  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3 rounded-2xl bg-brand-cyan/10 p-4 text-brand-navy ring-1 ring-brand-cyan/30">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" aria-hidden="true" />
        <div>
          <p className="font-bold">
            {records.length} report{records.length === 1 ? "" : "s"} partially
            match your details.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            These reports share your state, sex, a close age, and a nearby
            vaccination date. Tap each one to review and decide if it&apos;s yours.
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {records.map((r) => (
          <PotentialItem key={r.vaersId} record={r} />
        ))}
      </ul>
    </div>
  );
}

function PotentialItem({ record }: { record: VaersRecord }) {
  const [open, setOpen] = useState(false);
  const stateName = findStateByCode(record.state)?.name ?? record.state;
  const preview = record.symptoms.slice(0, 2).join(", ") || "—";

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left min-h-tap"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            VAERS {record.vaersId} · {record.vaxManu.split("\\")[0]}
          </span>
          <span className="mt-0.5 block truncate text-base text-brand-navy">
            {stateName} · age {record.ageYears} · {formatLongDate(record.vaxDate)}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {preview}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="border-t border-border bg-muted/30 px-4 py-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reported symptoms
          </p>
          <p className="mt-1 text-brand-navy">
            {record.symptoms.join(", ") || "—"}
          </p>
          {record.symptomText ? (
            <p className="mt-3 text-brand-navy">{record.symptomText}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {record.recvDate ? (
              <span>Reported {formatLongDate(record.recvDate)}</span>
            ) : null}
            {record.numDays != null ? (
              <span>{record.numDays} day{record.numDays === 1 ? "" : "s"} to onset</span>
            ) : null}
            <a
              href="https://wonder.cdc.gov/vaers.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Full report on CDC WONDER
            </a>
          </div>
        </div>
      ) : null}
    </li>
  );
}
