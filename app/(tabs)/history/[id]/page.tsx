"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checksRepo, type SavedCheck } from "@/lib/storage/db";
import { findStateByCode } from "@/lib/vaers/us-states";
import { formatLongDate } from "@/lib/vaers/dates";
import { ExactMatchCard } from "@/components/result-cards/exact-match-card";
import { PotentialMatchesList } from "@/components/result-cards/potential-matches-list";
import { NoMatchCard } from "@/components/result-cards/no-match-card";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

const SEX_LABELS = { F: "Female", M: "Male", U: "Prefer not to say" } as const;

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [item, setItem] = useState<SavedCheck | null | "missing">(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const row = await checksRepo.get(id);
      if (cancelled) return;
      setItem(row ?? "missing");
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (item === null) {
    return (
      <div className="flex flex-1 items-center justify-center pb-24">
        <div className="h-6 w-6 animate-pulse rounded-full bg-brand-cyan/30" />
      </div>
    );
  }

  if (item === "missing") {
    return (
      <div className={isSite ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "flex flex-1 flex-col px-6 pt-12 pb-32"}>
        <h1 className="text-2xl font-black text-brand-navy">Check not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That history entry isn&apos;t on this device.
        </p>
        <div className="mt-auto pt-10">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/history")}
          >
            Back to history
          </Button>
        </div>
      </div>
    );
  }

  const stateName =
    findStateByCode(item.input.state)?.name ?? item.input.state;

  const handleDelete = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this check?")
    ) {
      return;
    }
    await checksRepo.remove(item.id);
    router.push("/history");
  };

  return (
    <div className={isSite ? "mx-auto flex w-full max-w-3xl flex-1 flex-col" : "flex flex-1 flex-col px-6 pt-4 pb-32"}>
      <header>
        <button
          type="button"
          onClick={() => router.push("/history")}
          aria-label="Back to history"
          className="-ml-2 mb-2 flex h-12 w-12 items-center justify-center rounded-full text-brand-navy hover:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <p className="text-xs text-muted-foreground">
          Saved {new Date(item.createdAt).toLocaleString()}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-navy">
          Past check
        </h1>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-card">
        <Detail label="State" value={stateName} />
        <Detail label="Sex" value={SEX_LABELS[item.input.sex]} />
        <Detail
          label="DOB"
          value={`${formatLongDate(item.input.dob)} · age ${item.input.ageYears}`}
        />
        <Detail
          label="Dose(s)"
          value={item.input.doseDates.map(formatLongDate).join(" · ")}
        />
      </dl>

      <div className="mt-6 space-y-6">
        {item.result.exact.length > 0 ? (
          <ExactMatchCard records={item.result.exact} />
        ) : null}
        {item.result.exact.length === 0 && item.result.potential.length > 0 ? (
          <PotentialMatchesList records={item.result.potential} />
        ) : null}
        {item.result.exact.length > 0 && item.result.potential.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Other partial matches
            </h2>
            <PotentialMatchesList records={item.result.potential} />
          </section>
        ) : null}
        {item.result.none ? <NoMatchCard /> : null}
      </div>

      <div className="mt-8">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Delete this check
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 sm:col-span-1">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-brand-navy">{value}</dd>
    </div>
  );
}
