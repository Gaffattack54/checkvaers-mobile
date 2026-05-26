import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirstLaunchDisclaimer } from "@/components/shared/first-launch-disclaimer";

export default function CheckPage() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-8">
      <FirstLaunchDisclaimer />

      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy">
          Check VAERS
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Searches COVID-19 VAERS reports from the last 7 years.
        </p>
      </header>

      <div className="mt-auto pt-10">
        <Button asChild size="lg" className="w-full">
          <Link href="/check/state">Start a new check</Link>
        </Button>
        <p className="mt-4 text-balance text-center text-xs text-muted-foreground">
          This tool is not a medical diagnostic tool. Consult a healthcare
          provider for medical advice.{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
