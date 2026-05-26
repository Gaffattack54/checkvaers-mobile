"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  FilePlus2,
  Lightbulb,
  RotateCcw,
  Save,
} from "lucide-react";
import { reportRepo, type ReportDraft } from "@/lib/storage/db";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VAERS_REPORT_URL = "https://vaers.hhs.gov/reportevent.html";

interface ChecklistItem {
  key: string;
  label: string;
  helper?: string;
}

const CHECKLIST: ChecklistItem[] = [
  {
    key: "vaccine",
    label: "Vaccine name, manufacturer, and lot number",
    helper:
      "Printed on your vaccination card or your provider's after-visit summary.",
  },
  {
    key: "date",
    label: "Date(s) of vaccination",
    helper: "Including which dose number (primary, booster, etc.).",
  },
  {
    key: "symptoms",
    label: "Symptoms with dates of onset",
    helper: "When each symptom started and how long it lasted.",
  },
  {
    key: "treatment",
    label: "Treatment received and outcomes",
    helper: "Hospitalizations, medications, ER visits — and whether you recovered.",
  },
  {
    key: "provider",
    label: "Healthcare provider information",
    helper: "Name, clinic, and contact info of the provider who administered the dose.",
  },
  {
    key: "personal",
    label: "Your contact information",
    helper: "VAERS may follow up by phone or email for clarification.",
  },
  {
    key: "history",
    label: "Relevant medical history",
    helper: "Allergies, current medications, prior vaccine reactions.",
  },
];

const TIPS: string[] = [
  "Be specific about timing — VAERS uses time-from-vaccination windows to evaluate signals.",
  "Stick to what you observed. You don't need to prove causation; VAERS researchers will look at patterns.",
  "Include the names of any clinicians you saw, even ER staff — VAERS can request records with your permission.",
  "If multiple symptoms overlap, list each separately with its own onset date.",
  "You can update a report later if new information emerges. Keep your VAERS ID once you submit.",
];

export default function ReportPage() {
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void reportRepo
      .load()
      .then((d) => {
        if (!cancelled) setDraft(d);
      })
      .catch(() => {
        // Storage unavailable — still let the user use the checklist transiently.
        if (!cancelled) {
          setDraft({
            id: "current",
            checks: {},
            notes: "",
            updatedAt: Date.now(),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (key: string) => {
    if (!draft) return;
    const next: ReportDraft = {
      ...draft,
      checks: { ...draft.checks, [key]: !draft.checks[key] },
      updatedAt: Date.now(),
    };
    setDraft(next);
    setSaving(true);
    try {
      await reportRepo.save({ checks: next.checks });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const updateNotes = async (notes: string) => {
    if (!draft) return;
    setDraft({ ...draft, notes });
  };

  const persistNotes = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await reportRepo.save({ notes: draft.notes });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear all checklist progress?")
    ) {
      return;
    }
    await reportRepo.reset();
    const fresh = await reportRepo.load();
    setDraft(fresh);
    setSavedAt(null);
  };

  const completed = draft
    ? CHECKLIST.filter((c) => draft.checks[c.key]).length
    : 0;

  return (
    <div className="flex flex-1 flex-col px-6 pt-12 pb-12">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <FilePlus2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy">
          File a VAERS report
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Anyone can submit a VAERS report. The official form lives at
          vaers.hhs.gov. Use the checklist below to gather what you need
          before you start.
        </p>
      </header>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Checklist
          </h2>
          <span className="text-xs text-muted-foreground">
            {completed} / {CHECKLIST.length} ready
          </span>
        </div>

        <ul className="mt-3 space-y-2">
          {CHECKLIST.map((item) => {
            const done = !!draft?.checks[item.key];
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => toggle(item.key)}
                  aria-pressed={done}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-left min-h-tap shadow-sm transition-colors",
                    done
                      ? "border-brand-cyan/60 bg-brand-cyan/5"
                      : "border-border hover:bg-accent/30"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      done
                        ? "border-brand-cyan bg-brand-cyan text-white"
                        : "border-border bg-background"
                    )}
                    aria-hidden="true"
                  >
                    {done ? <Check className="h-4 w-4" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-base font-medium",
                        done ? "text-brand-navy" : "text-brand-navy"
                      )}
                    >
                      {item.label}
                    </span>
                    {item.helper ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.helper}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 space-y-2">
          <label
            htmlFor="report-notes"
            className="text-sm font-semibold text-brand-navy"
          >
            Notes to yourself
          </label>
          <textarea
            id="report-notes"
            value={draft?.notes ?? ""}
            onChange={(e) => updateNotes(e.target.value)}
            onBlur={persistNotes}
            rows={4}
            placeholder="Jot anything you don't want to forget — dates, lot numbers, the name of the ER nurse, etc."
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Save className="h-3 w-3" aria-hidden="true" /> Saving…
              </span>
            ) : savedAt ? (
              `Saved locally · ${new Date(savedAt).toLocaleTimeString()}`
            ) : (
              "Auto-saves to this device only."
            )}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-brand-cyan" aria-hidden="true" />
          Tips
        </h2>
        <ul className="mt-3 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm text-brand-navy shadow-card">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan"
                aria-hidden="true"
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 space-y-3">
        <Button asChild size="lg" className="w-full">
          <a
            href={VAERS_REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-5 w-5" aria-hidden="true" />
            Open the official VAERS form
          </a>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={resetDraft}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Reset checklist
        </Button>
        <p className="text-balance text-center text-xs text-muted-foreground">
          The form opens at vaers.hhs.gov in a new tab. CheckVAERS can&apos;t
          submit reports for you — only HHS can accept them.
        </p>
      </div>
    </div>
  );
}
