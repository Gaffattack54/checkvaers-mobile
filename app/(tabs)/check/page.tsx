import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirstLaunchDisclaimer } from "@/components/shared/first-launch-disclaimer";

export default function CheckPage() {
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

function Step({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-sm">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-xs font-bold text-brand-cyan">
        {n}
      </span>
      <span className="font-medium">{label}</span>
    </li>
  );
}
