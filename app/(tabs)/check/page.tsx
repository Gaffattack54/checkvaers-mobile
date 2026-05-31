import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirstLaunchDisclaimer } from "@/components/shared/first-launch-disclaimer";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

export default function CheckPage() {
  if (isSite) return <SiteCheckLanding />;
  return <AppCheckLanding />;
}

function SiteCheckLanding() {
  return (
    <div className="flex flex-1 flex-col px-2 py-2 md:px-0 md:py-4">
      <FirstLaunchDisclaimer />

      <header className="max-w-3xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan md:h-14 md:w-14">
          <Search className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">
          Check VAERS
        </p>
        <h1 className="mt-2 text-balance text-3xl font-black leading-[1.05] tracking-tight text-brand-navy md:text-4xl lg:text-5xl">
          Was your vaccine adverse event reported?
        </h1>
        <p className="mt-3 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
          Searches 889,000+ COVID-19 reports from 2020–2025 of public VAERS
          data. Four quick questions. Matching runs on this device.
        </p>
      </header>

      <ol className="mt-10 grid gap-3 md:mt-14 md:grid-cols-2 lg:grid-cols-4">
        <Step n={1} label="Your state" sub="Two-letter USPS code" />
        <Step n={2} label="Sex" sub="Male, female, or prefer not to say" />
        <Step n={3} label="Date of birth" sub="Used to compute age — never stored remotely" />
        <Step n={4} label="Vaccine dose date(s)" sub="Up to 5 doses; we match within ±7 days" />
      </ol>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row md:mt-12">
        <Button asChild size="lg" className="px-8 sm:w-auto">
          <Link href="/check/state">
            Start a new check
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="px-8 sm:w-auto">
          <Link href="/learn">Read the background</Link>
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Not a medical diagnostic tool. Consult a healthcare provider for
        medical advice.{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy
        </Link>
        .
      </p>
    </div>
  );
}

function AppCheckLanding() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-8">
      <FirstLaunchDisclaimer />

      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <Search className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">
          Check VAERS
        </p>
        <h1 className="mt-2 text-balance text-2xl font-black leading-[1.1] tracking-tight text-brand-navy">
          Was your vaccine adverse event reported?
        </h1>
        <p className="mt-3 text-balance text-sm text-muted-foreground">
          Searches 889,000+ COVID-19 reports from the last 7 years of public
          VAERS data. Four quick questions.
        </p>
      </header>

      <ol className="mt-8 space-y-2 text-sm text-brand-navy">
        <Step n={1} label="Your state" />
        <Step n={2} label="Sex" />
        <Step n={3} label="Date of birth" />
        <Step n={4} label="Vaccine dose date(s)" />
      </ol>

      <div className="mt-auto pt-10">
        <Button asChild size="lg" className="w-full">
          <Link href="/check/state">Start a new check</Link>
        </Button>
        <p className="mt-4 text-balance text-center text-xs text-muted-foreground">
          Not a medical diagnostic tool. Consult a healthcare provider for
          medical advice.{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Step({ n, label, sub }: { n: number; label: string; sub?: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-xs font-bold text-brand-cyan">
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-brand-navy">
          {label}
        </span>
        {sub ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {sub}
          </span>
        ) : null}
      </span>
    </li>
  );
}
