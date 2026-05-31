import Link from "next/link";
import {
  ChevronLeft,
  Database,
  Lock,
  Smartphone,
  Code,
  Mail,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "About",
  description:
    "About CheckVAERS: mission, dataset provenance, technology, and how the app works.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-16">
      <Link
        href="/"
        className="-ml-2 inline-flex h-12 items-center gap-1 rounded-full px-3 text-brand-navy hover:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <header className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">
          About
        </p>
        <h1 className="mt-1 text-balance text-3xl font-black leading-[1.05] tracking-tight text-brand-navy">
          CheckVAERS
        </h1>
        <p className="mt-3 text-balance text-sm text-muted-foreground">
          A mobile-first way to search public VAERS COVID-19 adverse-event
          reports — without giving up your privacy to do it.
        </p>
      </header>

      <section className="mt-8 space-y-3">
        <Card icon={<Lock className="h-5 w-5" />} title="Built on a simple promise">
          <p>
            None of your details ever leave your device. The matching
            engine runs entirely in your browser, against a cached snapshot
            of the public VAERS dataset.
          </p>
          <p>
            There&apos;s no server collecting your inputs, no account,
            no analytics. We can&apos;t reconstruct your check even if
            we wanted to — there&apos;s nothing to reconstruct from.
          </p>
        </Card>

        <Card icon={<Database className="h-5 w-5" />} title="The data">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <span className="font-semibold">Source:</span> public VAERS
              data published by the U.S. Department of Health &amp; Human
              Services.
            </li>
            <li>
              <span className="font-semibold">Scope:</span> COVID-19
              vaccine reports from 2020 through 2025 — 889,000+ records.
            </li>
            <li>
              <span className="font-semibold">Updates:</span> periodically
              re-prepared from the upstream CSV exports. The first time
              the app launches it downloads ~70 MB; after that it works
              offline.
            </li>
            <li>
              <span className="font-semibold">De-identified:</span> HHS
              removes patient identifiers before publishing VAERS data.
              CheckVAERS only ever sees this de-identified version.
            </li>
          </ul>
        </Card>

        <Card icon={<Smartphone className="h-5 w-5" />} title="How it&apos;s built">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Progressive Web App — installable to your phone&apos;s home
              screen on iOS and Android.
            </li>
            <li>
              Full offline support after the first launch.
            </li>
            <li>
              Matching engine scans only the slice of records that share
              your state — typically &lt;10ms even with 900,000 records.
            </li>
            <li>
              Past checks are saved locally only (browser IndexedDB) so
              you can revisit results without re-running the query.
            </li>
          </ul>
        </Card>

        <Card icon={<Code className="h-5 w-5" />} title="Open source">
          <p>
            The full source code is on{" "}
            <a
              href="https://github.com/Gaffattack54/checkvaers-mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold text-brand-cyan underline underline-offset-2"
            >
              GitHub
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            . The privacy story isn&apos;t a marketing claim — you can
            read the matcher, the storage layer, and confirm there is no
            backend.
          </p>
        </Card>

        <Card icon={<Mail className="h-5 w-5" />} title="Get in touch">
          <p>
            Questions, corrections, or partnership inquiries:{" "}
            <a
              href="mailto:hello@checkvaers.app"
              className="font-semibold text-brand-cyan underline underline-offset-2"
            >
              hello@checkvaers.app
            </a>
          </p>
        </Card>
      </section>

      <p className="mt-8 text-balance text-center text-xs text-muted-foreground">
        Not affiliated with the CDC, FDA, or HHS. Not medical advice.{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy
        </Link>
        .
      </p>
    </main>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
          {icon}
        </span>
        <h2 className="text-base font-bold text-brand-navy">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-brand-navy">
        {children}
      </div>
    </article>
  );
}
