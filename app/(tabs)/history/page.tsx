"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  History as HistoryIcon,
  Trash2,
} from "lucide-react";
import { checksRepo, type SavedCheck } from "@/lib/storage/db";
import { findStateByCode } from "@/lib/vaers/us-states";
import { formatLongDate } from "@/lib/vaers/dates";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const [items, setItems] = useState<SavedCheck[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const rows = await checksRepo.list();
      setItems(rows);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't read local history."
      );
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleClear = async () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear all checks from this device?")
    ) {
      return;
    }
    await checksRepo.clear();
    await refresh();
  };

  return (
    <div className="flex flex-1 flex-col px-6 pt-12">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <HistoryIcon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy">
          History
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Past checks performed on this device. Stored only here — clearing
          your browser data will remove them.
        </p>
      </header>

      {error ? (
        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="mt-6">
        {items === null ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ul className="space-y-3">
              {items.map((c) => (
                <HistoryRow key={c.id} item={c} />
              ))}
            </ul>
            <div className="mt-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleClear}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Clear all history
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function HistoryRow({ item }: { item: SavedCheck }) {
  const stateName =
    findStateByCode(item.input.state)?.name ?? item.input.state;
  const sexLabel =
    item.input.sex === "F" ? "Female" : item.input.sex === "M" ? "Male" : "Prefer not to say";
  const resultKind =
    item.result.exact.length > 0
      ? `${item.result.exact.length} exact match${item.result.exact.length === 1 ? "" : "es"}`
      : item.result.potential.length > 0
        ? `${item.result.potential.length} potential match${item.result.potential.length === 1 ? "" : "es"}`
        : "No matches";

  const runDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="rounded-2xl border border-border bg-card shadow-card">
      <Link
        href={`/history/${item.id}`}
        className="flex items-center justify-between gap-3 px-4 py-4 min-h-tap hover:bg-accent/30"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {runDate} · {resultKind}
          </span>
          <span className="mt-0.5 block truncate text-base text-brand-navy">
            {stateName} · {sexLabel} · age {item.input.ageYears}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {item.input.doseDates.map(formatLongDate).join(" · ") || "—"}
          </span>
        </span>
        <ChevronRight
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground">
      <p>No checks yet.</p>
      <Button asChild size="sm" variant="outline" className="mt-4">
        <Link href="/check">Run your first check</Link>
      </Button>
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3" aria-label="Loading history">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-20 animate-pulse rounded-2xl border border-border bg-card shadow-card"
        />
      ))}
    </ul>
  );
}
