import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-cyan/[0.06] via-background to-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-hex-pattern bg-repeat opacity-[0.04]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-1/2 -z-10 h-[480px] w-[480px] translate-x-1/2 rounded-full bg-brand-cyan/15 blur-3xl md:translate-x-[40%]"
      />

      <div className="mx-auto flex max-w-6xl flex-col px-6 pt-12 pb-16 md:px-10 md:pt-20 md:pb-24 lg:flex-row lg:items-center lg:gap-16 lg:pt-28 lg:pb-32">
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Private VAERS search
          </span>
          <h1 className="mt-6 text-balance text-4xl font-black leading-[1.04] tracking-tight text-brand-navy sm:text-5xl lg:text-6xl">
            Was your vaccine adverse event reported to VAERS?
          </h1>
          <p className="mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            Search <span className="font-semibold text-brand-navy">889,000+</span>{" "}
            public COVID-19 reports published by HHS. Matching runs on your
            device — your details never leave your phone or computer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-8 sm:w-auto">
              <Link href="/check">
                Check VAERS now
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 sm:w-auto">
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No account · No tracking · Works offline after first load
          </p>
        </div>

        {/* Phone mockup-ish illustration. Pure CSS — no image asset needed. */}
        <div className="mt-12 flex flex-1 justify-center lg:mt-0">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative h-[520px] w-[260px]">
      <div className="absolute inset-0 rounded-[42px] border-[10px] border-brand-navy bg-brand-navy shadow-2xl shadow-brand-navy/20">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-brand-navy" />
        <div className="absolute inset-1.5 overflow-hidden rounded-[34px] bg-background">
          {/* Mock app content */}
          <div className="flex h-full flex-col px-4 pt-8 pb-16">
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              ✓ MATCH FOUND
            </span>
            <h3 className="mt-3 text-lg font-black leading-tight text-brand-navy">
              Yes — 3 matching reports.
            </h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Searched 889,521 public COVID-19 VAERS reports
            </p>

            <div className="mt-4 space-y-2">
              <MockCard manu="PFIZER\BIONTECH" pct="58%" />
              <MockCard manu="MODERNA" pct="34%" />
              <MockCard manu="JANSSEN" pct="8%" />
            </div>

            <div className="mt-4 flex flex-wrap gap-1">
              {["Headache", "Fatigue", "Myalgia", "Fever"].map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[9px] text-brand-navy"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Bottom tab nav mock */}
            <div className="mt-auto -mx-4 -mb-16 border-t border-border bg-background/95 pt-2 pb-3">
              <div className="flex justify-around text-[9px] font-medium">
                <div className="flex flex-col items-center text-brand-cyan">
                  <span className="h-4 w-4 rounded-full bg-brand-cyan/20" />
                  Check
                </div>
                <div className="flex flex-col items-center text-muted-foreground">
                  <span className="h-4 w-4 rounded-full bg-border" />
                  Learn
                </div>
                <div className="flex flex-col items-center text-muted-foreground">
                  <span className="h-4 w-4 rounded-full bg-border" />
                  Report
                </div>
                <div className="flex flex-col items-center text-muted-foreground">
                  <span className="h-4 w-4 rounded-full bg-border" />
                  History
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCard({ manu, pct }: { manu: string; pct: string }) {
  return (
    <div className="rounded-lg bg-card p-2 shadow-sm">
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="font-semibold text-brand-navy">
          {manu.split("\\")[0]}
        </span>
        <span className="tabular-nums text-muted-foreground">{pct}</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-cyan"
          style={{ width: pct }}
        />
      </div>
    </div>
  );
}
