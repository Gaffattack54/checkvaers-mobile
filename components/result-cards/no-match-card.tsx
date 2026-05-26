"use client";

import Link from "next/link";
import { CircleHelp, FilePlus2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoMatchCard() {
  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-brand-navy ring-1 ring-border">
        <CircleHelp
          className="mt-0.5 h-6 w-6 shrink-0 text-brand-navy"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold">No matching reports found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No reports matching your exact details were found in the VAERS
            database (last 7 years of COVID-19 reports).
          </p>
        </div>
      </header>

      <div className="rounded-2xl bg-card p-4 text-sm text-brand-navy shadow-card">
        <p>
          This doesn&apos;t necessarily mean your provider failed to report.
          Not every adverse event is on the mandatory reporting list, and the
          public VAERS dataset can lag the live one.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <Button asChild size="lg" className="w-full">
          <Link href="/report">
            <FilePlus2 className="mr-2 h-5 w-5" aria-hidden="true" />
            File a VAERS report yourself
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/learn">
            <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
            Learn more about reporting
          </Link>
        </Button>
      </div>
    </div>
  );
}
