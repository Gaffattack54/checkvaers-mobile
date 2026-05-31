import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site-config";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-16">
      <Link
        href="/"
        className="-ml-2 inline-flex h-12 items-center gap-1 rounded-full px-3 text-brand-navy hover:bg-muted"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      <header className="mt-4 flex flex-col items-start gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-black tracking-tight text-brand-navy">
          Privacy
        </h1>
        <p className="text-sm text-muted-foreground">
          The short version: nothing about you leaves your device.
        </p>
      </header>

      <section className="mt-8 space-y-5 text-sm leading-relaxed text-brand-navy">
        <Block title="What we collect">
          <p>
            <strong>Nothing.</strong> CheckVAERS doesn&apos;t use cookies for
            tracking, doesn&apos;t embed third-party analytics, and
            doesn&apos;t have a backend that receives your inputs.
          </p>
        </Block>

        <Block title="Where your inputs go">
          <p>
            The details you enter — state, sex, date of birth, vaccine dose
            dates — are stored only in your browser:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <span className="font-semibold">Session storage</span> holds
              your in-progress check until you close the tab.
            </li>
            <li>
              <span className="font-semibold">IndexedDB (on this device)</span>{" "}
              holds completed checks for the History tab and any
              Report-tab checklist progress.
            </li>
          </ul>
          <p>
            Clearing your browser data removes all of it. You can also
            clear your History from the History tab.
          </p>
        </Block>

        <Block title="Where the VAERS data comes from">
          <p>
            CheckVAERS downloads a prepared snapshot of public VAERS
            COVID-19 reports (from vaers.hhs.gov) the first time you open
            the app. The VAERS data we search is the public,
            de-identified version published by the U.S. Department of
            Health & Human Services. Subsequent checks run against the
            cached copy — no additional network calls are made to
            perform a check.
          </p>
        </Block>

        <Block title="Security in transit and on your device">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              All connections to CheckVAERS use HTTPS encryption.
            </li>
            <li>
              The VAERS data snapshot is delivered over HTTPS and
              verified against an upstream ETag before any update.
            </li>
            <li>
              Your check details and saved history are kept in your
              browser&apos;s on-device storage. They aren&apos;t
              transmitted to a server.
            </li>
          </ul>
        </Block>

        <Block title="What CheckVAERS isn't">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Not affiliated with the CDC, FDA, HHS, or any government
              agency.
            </li>
            <li>Not a medical diagnostic tool. Not medical advice.</li>
            <li>
              Not a substitute for filing your own VAERS report — see the
              Report tab.
            </li>
          </ul>
        </Block>

        <Block title="If you change your mind">
          <p>
            From the History tab you can clear individual checks or wipe
            all local data. Uninstalling the app or clearing browser
            storage removes everything CheckVAERS knows about you.
          </p>
        </Block>

        <Block title="Questions or feedback?">
          <p>
            Email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-brand-cyan underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            — we read every message. No tracking pixels, no auto-replies.
          </p>
        </Block>
      </section>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="text-base font-bold text-brand-navy">{title}</h2>
      <div className="mt-2 space-y-2 text-sm text-brand-navy">{children}</div>
    </div>
  );
}
