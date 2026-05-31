"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckDraft } from "@/lib/state/check-store";
import { checkDraftSchema } from "@/lib/validation/schemas";
import { findMatchesIndexed } from "@/lib/vaers/matcher";
import { localDateFromIso, ageInYears } from "@/lib/vaers/dates";
import {
  useVaersData,
  useVaersIndex,
  type VaersDataset,
} from "@/lib/vaers/data-loader";
import type { MatchResult } from "@/lib/vaers/types";
import { checksRepo } from "@/lib/storage/db";
import { ExactMatchCard } from "@/components/result-cards/exact-match-card";
import { PotentialMatchesList } from "@/components/result-cards/potential-matches-list";
import { NoMatchCard } from "@/components/result-cards/no-match-card";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

type Phase =
  | { kind: "waiting-for-data" }
  | { kind: "matching" }
  | { kind: "invalid" }
  | { kind: "ready"; result: MatchResult; dataset: VaersDataset; note?: string };

export default function ResultPage() {
  const router = useRouter();
  const draft = useCheckDraft();
  const reset = useCheckDraft((s) => s.reset);
  const loader = useVaersData();
  const index = useVaersIndex(loader);
  const [phase, setPhase] = useState<Phase>({ kind: "waiting-for-data" });

  const parsed = useMemo(() => {
    const r = checkDraftSchema.safeParse({
      state: draft.state,
      sex: draft.sex,
      dob: draft.dob,
      doseDates: draft.doseDates,
    });
    return r.success ? r.data : null;
  }, [draft.state, draft.sex, draft.dob, draft.doseDates]);

  // Once both the draft is valid AND the dataset is available, run the match.
  useEffect(() => {
    if (!parsed) {
      setPhase({ kind: "invalid" });
      return;
    }

    // Wait until the loader reports a ready dataset (or an error with a
    // fallback) AND the state-indexed map has been built.
    let dataset: VaersDataset | null = null;
    let note: string | undefined;
    if (loader.kind === "ready") {
      dataset = loader.data;
    } else if (loader.kind === "error" && loader.fallback) {
      dataset = loader.fallback;
      note = loader.message;
    } else {
      setPhase({ kind: "waiting-for-data" });
      return;
    }
    if (!index) {
      setPhase({ kind: "waiting-for-data" });
      return;
    }

    setPhase({ kind: "matching" });

    // Matching runs on the main thread but only scans the user's state
    // slice (~5% of records) thanks to the byState index, so we're at
    // ~10ms on a phone CPU even with 900k records — well under one frame.
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled || !dataset || !index) return;
      const ageYears = ageInYears(parsed.dob);
      const result = findMatchesIndexed(
        {
          state: parsed.state,
          sex: parsed.sex,
          ageYears,
          vaccineDates: parsed.doseDates.map(localDateFromIso),
        },
        index
      );
      setPhase({ kind: "ready", result, dataset, note });
      checksRepo
        .create(
          {
            state: parsed.state,
            sex: parsed.sex,
            dob: parsed.dob,
            ageYears,
            doseDates: parsed.doseDates,
          },
          result
        )
        .catch(() => {
          /* non-fatal — history is best-effort */
        });
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [parsed, loader, index]);

  if (phase.kind === "waiting-for-data" || phase.kind === "matching") {
    return <LoadingState loader={loader} phase={phase.kind} />;
  }

  if (phase.kind === "invalid") {
    return (
      <div className="flex flex-1 flex-col px-6 pt-12 pb-32">
        <h1 className="text-2xl font-black text-brand-navy">
          We&apos;re missing some details.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Head back and finish filling out the check.
        </p>
        <div className="mt-auto pt-10">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/check")}
          >
            Back to start
          </Button>
        </div>
      </div>
    );
  }

  const { result, dataset, note } = phase;
  return (
    <div
      className={
        isSite
          ? "mx-auto flex w-full max-w-3xl flex-1 flex-col"
          : "flex flex-1 flex-col px-6 pt-6 pb-32"
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">
        Your VAERS check
      </p>
      <h1
        className={
          isSite
            ? "mt-1 text-balance text-3xl font-black leading-[1.05] tracking-tight text-brand-navy md:text-4xl lg:text-5xl"
            : "mt-1 text-balance text-3xl font-black leading-[1.05] tracking-tight text-brand-navy"
        }
      >
        {result.exact.length > 0
          ? result.exact.length === 1
            ? "Yes — one matching report."
            : `Yes — ${result.exact.length} matching reports.`
          : result.potential.length > 0
            ? `Maybe — ${result.potential.length} partial match${result.potential.length === 1 ? "" : "es"}.`
            : "No matching report found."}
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Searched {dataset.records.length.toLocaleString()}{" "}
        {dataset.source === "mock" ? "sample" : "public"} COVID-19 VAERS
        reports ({dataset.yearStart}–{dataset.yearEnd}). Nothing left your
        device.
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Dataset generated{" "}
        {new Date(dataset.generatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
        {dataset.source === "cache" ? " · loaded from cache" : null}
        {dataset.source === "network" ? " · just downloaded" : null}
        {dataset.source === "mock" ? " · bundled sample" : null}
      </p>

      {note ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{note}</span>
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        {result.exact.length > 0 ? (
          <ExactMatchCard records={result.exact} />
        ) : null}

        {result.exact.length === 0 && result.potential.length > 0 ? (
          <PotentialMatchesList records={result.potential} />
        ) : null}

        {result.exact.length > 0 && result.potential.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Other partial matches
            </h2>
            <PotentialMatchesList records={result.potential} />
          </section>
        ) : null}

        {result.none ? <NoMatchCard /> : null}
      </div>

      <p className="mt-8 rounded-xl bg-muted/60 p-3 text-balance text-center text-xs text-muted-foreground">
        This tool searches publicly available VAERS data. It is not a medical
        diagnostic tool. Consult a healthcare provider for medical advice.{" "}
        <a href="/privacy" className="underline underline-offset-2">
          Privacy
        </a>
        .
      </p>

      <div className="mt-6">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            reset();
            router.push("/check");
          }}
        >
          <RotateCcw className="mr-2 h-5 w-5" aria-hidden="true" />
          Start a new check
        </Button>
      </div>
    </div>
  );
}

function LoadingState({
  loader,
  phase,
}: {
  loader: ReturnType<typeof useVaersData>;
  phase: "waiting-for-data" | "matching";
}) {
  const isDownloading = loader.kind === "loading" && phase === "waiting-for-data";
  const progress =
    loader.kind === "loading" && loader.progress != null
      ? Math.round(loader.progress * 100)
      : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
        <ShieldCheck className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="mt-6 flex items-center gap-2 text-brand-navy">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-base font-semibold">
          {isDownloading
            ? "Downloading VAERS database…"
            : "Searching VAERS database…"}
        </span>
      </div>
      <p className="mt-2 text-balance text-sm text-muted-foreground">
        {isDownloading
          ? "One-time download. Subsequent checks work offline."
          : "Comparing your details against COVID-19 reports, right here on your device."}
      </p>
      {progress != null ? (
        <div
          className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-muted"
          aria-label={`Download progress: ${progress}%`}
          role="progressbar"
          aria-valuenow={progress}
        >
          <div
            className="h-full bg-brand-cyan transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
