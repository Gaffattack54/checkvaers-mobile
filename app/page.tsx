import Link from "next/link";
import { ShieldCheck, Lock, Database, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-safe pb-safe">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hex-pattern bg-repeat opacity-[0.04]" />

      <header className="flex flex-col items-center pt-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <ShieldCheck className="h-9 w-9" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">
          CheckVAERS
        </p>
        <h1 className="mt-2 text-balance text-3xl font-black leading-[1.05] tracking-tight text-brand-navy">
          Was your vaccine adverse event reported to VAERS?
        </h1>
        <p className="mt-3 text-balance text-sm text-muted-foreground">
          Search the public VAERS database for COVID-19 reports matching your
          details — right on your phone.
        </p>
      </header>

      <section className="mt-8 space-y-3">
        <FeatureRow
          icon={<Lock className="h-5 w-5" aria-hidden="true" />}
          title="Private by design"
          body="Matching runs on your device. None of your details are transmitted."
        />
        <FeatureRow
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          title="Real VAERS data"
          body="889,000+ public COVID-19 reports from HHS, updated periodically."
        />
        <FeatureRow
          icon={<Smartphone className="h-5 w-5" aria-hidden="true" />}
          title="Works offline"
          body="Install to your home screen. After the first load, no network needed."
        />
      </section>

      <div className="mt-auto pt-8 space-y-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/check">Check VAERS now</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/learn">About VAERS</Link>
        </Button>
        <p className="text-balance px-2 text-center text-xs text-muted-foreground">
          Not a medical diagnostic tool. Consult a healthcare provider for
          medical advice.{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
          .
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
