"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Share2, ShieldCheck } from "lucide-react";
import type { VaersRecord } from "@/lib/vaers/types";
import { Button } from "@/components/ui/button";
import { formatLongDate } from "@/lib/vaers/dates";
import { cn } from "@/lib/utils";

interface ExactMatchCardProps {
  records: VaersRecord[];
}

const INITIAL_VISIBLE = 10;
const PAGE_SIZE = 10;

export function ExactMatchCard({ records }: ExactMatchCardProps) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const total = records.length;
  const isPlural = total > 1;
  const shown = records.slice(0, visible);
  const hiddenCount = Math.max(0, total - visible);

  const summary = useMemo(() => summarize(records), [records]);

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-bold">
            {isPlural
              ? `${total.toLocaleString()} matching reports found.`
              : "Matching report found."}
          </p>
          <p className="mt-1 text-sm">
            {isPlural
              ? "These reports closely match your state, sex, age, and vaccination timing. Tap to expand."
              : "This report closely matches your state, sex, age, and vaccination timing. Tap to expand."}
          </p>
        </div>
      </header>

      {total > 1 ? <SummaryPanel summary={summary} /> : null}

      <ul className="space-y-3">
        {shown.map((r) => (
          <ExactRecordItem key={r.vaersId} record={r} />
        ))}
      </ul>

      {hiddenCount > 0 ? (
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() =>
            setVisible((v) => Math.min(total, v + PAGE_SIZE))
          }
        >
          Show {Math.min(PAGE_SIZE, hiddenCount).toLocaleString()} more
          {hiddenCount > PAGE_SIZE
            ? ` (${hiddenCount.toLocaleString()} remaining)`
            : ""}
        </Button>
      ) : null}

      <ShareResultButton records={records} />
    </div>
  );
}

interface Summary {
  total: number;
  byManu: Array<{ label: string; count: number; pct: number }>;
  topSymptoms: Array<{ name: string; count: number }>;
}

function summarize(records: VaersRecord[]): Summary {
  const total = records.length;
  const manuCounts = new Map<string, number>();
  const symCounts = new Map<string, number>();
  for (const r of records) {
    const m = r.vaxManu.split("\\")[0]; // "PFIZER\\BIONTECH" → "PFIZER"
    manuCounts.set(m, (manuCounts.get(m) ?? 0) + 1);
    for (const s of r.symptoms) {
      symCounts.set(s, (symCounts.get(s) ?? 0) + 1);
    }
  }
  const byManu = Array.from(manuCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
    }));
  const topSymptoms = Array.from(symCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  return { total, byManu, topSymptoms };
}

function SummaryPanel({ summary }: { summary: Summary }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        At a glance
      </h2>

      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground">
          By manufacturer
        </p>
        <ul className="mt-2 space-y-1.5">
          {summary.byManu.map((m) => (
            <li key={m.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-brand-navy">{m.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {m.count.toLocaleString()} · {m.pct}%
                </span>
              </div>
              <div
                className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-brand-cyan"
                  style={{ width: `${Math.max(2, m.pct)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {summary.topSymptoms.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Most commonly reported symptoms
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {summary.topSymptoms.map((s) => (
              <li
                key={s.name}
                className="rounded-full bg-brand-cyan/10 px-2.5 py-1 text-xs text-brand-navy"
              >
                {s.name}{" "}
                <span className="tabular-nums text-muted-foreground">
                  · {s.count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
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
            {record.numDays != null ? (
              <Field label="Days to onset" value={String(record.numDays)} />
            ) : null}
            {record.recvDate ? (
              <Field
                label="Report received"
                value={formatLongDate(record.recvDate)}
              />
            ) : null}
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
          <p className="mt-3 text-xs text-muted-foreground">
            <a
              href={`https://wonder.cdc.gov/vaers.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              View full report on CDC WONDER
            </a>{" "}
            (lookup by VAERS ID).
          </p>
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
        : `CheckVAERS found ${records.length} matching VAERS reports.`;
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
