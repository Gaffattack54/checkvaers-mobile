import { ExpandableCard } from "@/components/shared/expandable-card";

export function MarketingFaq() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
          Common questions
        </p>
        <h2 className="mt-3 text-balance text-3xl font-black tracking-tight text-brand-navy md:text-4xl">
          What people ask first.
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        <ExpandableCard
          title="What is VAERS?"
          summary="The federal early-warning system for vaccine adverse events."
          defaultOpen
        >
          <p>
            VAERS — the Vaccine Adverse Event Reporting System — is the
            national reporting system co-managed by CDC and FDA. Anyone
            can file a VAERS report about a health event that follows a
            vaccination. A VAERS report is not proof of causation; it&apos;s
            a signal researchers use to identify patterns that warrant
            investigation.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="Does CheckVAERS see my information?"
          summary="No. None of your details ever leave your device."
        >
          <p>
            Everything you enter — your state, sex, date of birth, vaccine
            dates — is stored in your browser only. We have no backend
            that receives it. We can&apos;t see your check, can&apos;t
            reconstruct it, can&apos;t share it.
          </p>
          <p>
            All matching runs in JavaScript, in your browser, against a
            cached snapshot of the public VAERS dataset.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="Is this medical advice?"
          summary="No. CheckVAERS is a search tool, not a diagnostic."
        >
          <p>
            CheckVAERS shows you whether reports matching your details
            exist in the public VAERS database. It does not interpret
            them, diagnose conditions, or recommend actions. Always
            consult a healthcare provider for medical advice.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="How current is the data?"
          summary="A refreshed snapshot of the public VAERS COVID-19 dataset."
        >
          <p>
            We use the publicly available VAERS COVID-19 dataset from
            vaers.hhs.gov, filtered to 2020–2025. The snapshot is
            re-prepared periodically; the date shown on the result page
            tells you when this device last received an update.
          </p>
          <p>
            The live VAERS database may contain reports that haven&apos;t
            yet propagated into the public download. We do our best to
            stay current.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="Why does the first load take a moment?"
          summary="A one-time ~70 MB dataset download — then offline forever."
        >
          <p>
            The first time you open CheckVAERS, the app downloads the
            prepared snapshot (currently ~70 MB compressed) so it can run
            future checks entirely on your device. Subsequent visits
            load instantly from your local cache.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="Is this affiliated with the CDC or HHS?"
          summary="No. CheckVAERS is an independent search tool."
        >
          <p>
            CheckVAERS is not affiliated with, endorsed by, or operated
            by the CDC, FDA, HHS, or any government agency. We consume
            their publicly published de-identified data the same way any
            researcher would.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="How do I file a VAERS report myself?"
          summary="We deep-link you to the official form."
        >
          <p>
            The Report tab in the app provides a checklist of what
            you&apos;ll need before filing and an &ldquo;Open the
            official VAERS form&rdquo; button that takes you to the
            HHS-operated submission page. CheckVAERS cannot submit
            reports for you — only HHS can accept them.
          </p>
        </ExpandableCard>
      </div>
    </section>
  );
}
