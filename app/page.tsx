import Link from "next/link";
import { ShieldCheck, Lock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-safe pb-safe">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hex-pattern bg-repeat opacity-[0.04]" />

      <header className="flex flex-col items-center pt-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <ShieldCheck className="h-9 w-9" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-brand-navy">
          CheckVAERS
        </h1>
        <p className="mt-3 text-balance text-base text-muted-foreground">
          Search the public VAERS database for COVID-19 adverse event reports
          matching your details.
        </p>
      </header>

      <section className="mt-10 space-y-3">
        <FeatureRow
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          title="Private by design"
          body="All matching happens on your device. No data leaves your phone."
        />
        <FeatureRow
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          title="Public VAERS data"
          body="Searches the last 7 years of COVID-19 reports from VAERS."
        />
      </section>

      <div className="mt-auto pt-10 space-y-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/check">Start a check</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/learn">Learn about VAERS</Link>
        </Button>
        <p className="text-balance px-2 text-center text-xs text-muted-foreground">
          This tool is not a medical diagnostic tool. Consult a healthcare
          provider for medical advice.
        </p>
      </div>
    </main>
  );
}

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-brand-navy">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
