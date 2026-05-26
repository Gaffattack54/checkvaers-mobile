"use client";

import { useState } from "react";
import { ChevronDown, Share2, ShieldCheck } from "lucide-react";
import type { VaersRecord } from "@/lib/vaers/types";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/vaers/dates";
import { cn } from "@/lib/utils";

interface ExactMatchCardProps {
  records: VaersRecord[];
}

export function ExactMatchCard({ records }: ExactMatchCardProps) {
  const isPlural = records.length > 1;
  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-bold">
            {isPlural
              ? `${records.length} matches found in VAERS.`
              : "Match found in VAERS."}
          </p>
          <p className="mt-1 text-sm">
            Your details closely match {isPlural ? "these reports" : "this report"}.
            Review the details below to confirm.
          </p>
        </div>
      </header>

      <ul className="space-y-3">
        {records.map((r) => (
          <ExactRecordItem key={r.vaersId} record={r} />
        ))}
      </ul>

      <ShareResultButton records={records} />
    </div>
  );
}

function ExactRecordItem({ record }: { record: VaersRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left min-h-tap"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            VAERS ID
          </span>
          <span className="block text-base font-bold text-brand-navy">
            {record.vaersId}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="border-t border-border bg-muted/30 px-4 py-4 text-sm">
          <dl className="grid grid-cols-2 gap-3">
            <Field label="Manufacturer" value={record.vaxManu} />
            <Field label="Vaccinated" value={formatLongDate(record.vaxDate)} />
            <Field label="State" value={record.state} />
            <Field label="Age at dose" value={`${record.ageYears}`} />
            <Field
              label="Days to onset"
              value={record.numDays != null ? String(record.numDays) : "—"}
            />
            <Field label="Report received" value={formatLongDate(record.recvDate)} />
          </dl>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reported symptoms
            </p>
            <p className="mt-1 text-brand-navy">
              {record.symptoms.join(", ") || "—"}
            </p>
          </div>
          {record.symptomText ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Narrative
              </p>
              <p className="mt-1 text-sm text-brand-navy">{record.symptomText}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-brand-navy">{value}</dd>
    </div>
  );
}

function ShareResultButton({ records }: { records: VaersRecord[] }) {
  const handleShare = async () => {
    const summary =
      records.length === 1
        ? `CheckVAERS found a matching VAERS report: ID ${records[0].vaersId}.`
        : `CheckVAERS found ${records.length} matching VAERS reports: ${records
            .map((r) => r.vaersId)
            .join(", ")}.`;
    if (typeof navigator === "undefined") return;
    const nav = navigator;
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: "CheckVAERS result", text: summary });
        return;
      }
      if (nav.clipboard) {
        await nav.clipboard.writeText(summary);
        // eslint-disable-next-line no-alert
        alert("Result copied to clipboard.");
      }
    } catch {
      /* user cancelled or share unsupported */
    }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleShare}
    >
      <Share2 className="mr-2 h-5 w-5" aria-hidden="true" />
      Share result
    </Button>
  );
}
