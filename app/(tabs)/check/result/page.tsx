"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckDraft } from "@/lib/state/check-store";
import { checkDraftSchema } from "@/lib/validation/schemas";
import { findMatches } from "@/lib/vaers/matcher";
import { MOCK_VAERS_RECORDS } from "@/lib/vaers/mock-data";
import { localDateFromIso, ageInYears } from "@/lib/vaers/dates";
import type { MatchResult } from "@/lib/vaers/types";
import { checksRepo } from "@/lib/storage/db";
import { ExactMatchCard } from "@/components/result-cards/exact-match-card";
import { PotentialMatchesList } from "@/components/result-cards/potential-matches-list";
import { NoMatchCard } from "@/components/result-cards/no-match-card";

type Status =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "ready"; result: MatchResult };

export default function ResultPage() {
  const router = useRouter();
  const draft = useCheckDraft();
  const reset = useCheckDraft((s) => s.reset);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const parsed = useMemo(() => {
    const r = checkDraftSchema.safeParse({
      state: draft.state,
      sex: draft.sex,
      dob: draft.dob,
      doseDates: draft.doseDates,
    });
    return r.success ? r.data : null;
  }, [draft.state, draft.sex, draft.dob, draft.doseDates]);

  useEffect(() => {
    if (!parsed) {
      setStatus({ kind: "invalid" });
      return;
    }
    // NOTE: We run the matcher inline against the 50-record mock dataset.
    // Step 10 swaps in the real ~100k-record snapshot, at which point this
    // should move into a Web Worker. The short artificial delay keeps the
    // UI honest about "we did work" and avoids a flash of result content.
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const ageYears = ageInYears(parsed.dob);
      const result = findMatches(
        {
          state: parsed.state,
          sex: parsed.sex,
          ageYears,
          vaccineDates: parsed.doseDates.map(localDateFromIso),
        },
        MOCK_VAERS_RECORDS
      );
      setStatus({ kind: "ready", result });
      // Fire-and-forget: persist to History. Silent on failure — IndexedDB
      // can be unavailable (private mode, quota exceeded, SSR cache thaw).
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
  }, [parsed]);

  if (status.kind === "loading") {
    return <LoadingState />;
  }

  if (status.kind === "invalid") {
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

  const { result } = status;
  return (
    <div className="flex flex-1 flex-col px-6 pt-6 pb-32">
      <h1 className="text-2xl font-black tracking-tight text-brand-navy">
        Your VAERS check
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Searched the public COVID-19 VAERS snapshot. No data left your device.
      </p>

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
        diagnostic tool. Consult a healthcare provider for medical advice.
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

function LoadingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
        <ShieldCheck className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="mt-6 flex items-center gap-2 text-brand-navy">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-base font-semibold">Searching VAERS database…</span>
      </div>
      <p className="mt-2 text-balance text-sm text-muted-foreground">
        Comparing your details against COVID-19 reports from the last 7 years,
        right here on your device.
      </p>
    </div>
  );
}
