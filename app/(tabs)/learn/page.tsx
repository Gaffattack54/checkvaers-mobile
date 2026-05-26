import { BookOpen, FileText, Info, ListChecks, ShieldCheck, Database } from "lucide-react";
import { ExpandableCard } from "@/components/shared/expandable-card";

export default function LearnPage() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-12">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <BookOpen className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy">
          Learn
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Plain-language background on VAERS, reporting rules, and this
          app&apos;s data.
        </p>
      </header>

      <section className="mt-8 space-y-3">
        <ExpandableCard
          icon={<Info className="h-5 w-5" aria-hidden="true" />}
          title="What is VAERS?"
          summary="The national vaccine adverse-event reporting system."
          sourceUrl="https://vaers.hhs.gov/about.html"
          defaultOpen
        >
          <p>
            VAERS — the Vaccine Adverse Event Reporting System — is the
            national early-warning system co-managed by the CDC and the FDA.
            Anyone (patients, family members, providers, manufacturers) can
            file a report about a health problem that follows a vaccination,
            whether or not the vaccine is suspected of causing it.
          </p>
          <p>
            VAERS data is publicly downloadable and is used to spot
            unexpected patterns that warrant deeper investigation. A report
            in VAERS is not itself proof that a vaccine caused the event.
          </p>
        </ExpandableCard>

        <ExpandableCard
          icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          title="Who is required to report?"
          summary="Providers, manufacturers, and the COVID-19 distinction."
          sourceUrl="https://vaers.hhs.gov/reportevent.html"
        >
          <p>
            Federal law (the National Childhood Vaccine Injury Act) requires
            healthcare providers and vaccine manufacturers to report certain
            adverse events that follow vaccination.
          </p>
          <p>
            <span className="font-semibold">COVID-19 vaccines are
            different.</span> Under the Emergency Use Authorization terms,
            providers must report <em>any</em> serious adverse event,
            multisystem inflammatory syndrome, or COVID-19 case resulting in
            hospitalization or death — regardless of whether the provider
            thinks the vaccine caused it.
          </p>
          <p>
            For non-COVID vaccines, only events on a specific reportable
            list (see next card) are mandatory. Anyone can voluntarily
            report anything.
          </p>
        </ExpandableCard>

        <ExpandableCard
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          title="Reportable events for non-COVID vaccines"
          summary="The official VICP table — anaphylaxis timing, encephalopathy, and more."
          sourceUrl="https://www.hrsa.gov/vaccine-compensation/vaccine-injury-table"
        >
          <p>
            HRSA maintains the Vaccine Injury Table, which lists specific
            adverse events tied to specific vaccines along with the
            time-from-vaccination windows in which they qualify as
            reportable. A shortened summary:
          </p>
          <div className="-mx-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[400px] border-collapse text-xs">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Vaccine</th>
                  <th className="px-3 py-2 text-left font-semibold">Event</th>
                  <th className="px-3 py-2 text-left font-semibold">Window</th>
                </tr>
              </thead>
              <tbody className="text-brand-navy">
                <tr className="border-t border-border">
                  <td className="px-3 py-2">Tetanus-containing</td>
                  <td className="px-3 py-2">Anaphylaxis</td>
                  <td className="px-3 py-2">≤ 4 hours</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">Pertussis-containing</td>
                  <td className="px-3 py-2">Encephalopathy</td>
                  <td className="px-3 py-2">≤ 72 hours</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">MMR</td>
                  <td className="px-3 py-2">Anaphylaxis</td>
                  <td className="px-3 py-2">≤ 4 hours</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">MMR (rubella)</td>
                  <td className="px-3 py-2">Chronic arthritis</td>
                  <td className="px-3 py-2">7–42 days</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">Varicella</td>
                  <td className="px-3 py-2">Disseminated infection</td>
                  <td className="px-3 py-2">≤ 30 days</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">Rotavirus</td>
                  <td className="px-3 py-2">Intussusception</td>
                  <td className="px-3 py-2">≤ 21 days</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Abbreviated for readability. Consult the linked HRSA Vaccine
            Injury Table for the full, current list and authoritative
            time windows.
          </p>
        </ExpandableCard>

        <ExpandableCard
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          title="The Vaccine Provider Agreement"
          summary="What providers commit to when they offer COVID-19 vaccines."
          sourceUrl="https://www.cdc.gov/vaccines/covid-19/vaccination-provider-support.html"
        >
          <p>
            Providers who administer federally-purchased COVID-19 vaccines
            sign the CDC COVID-19 Vaccination Program Provider Agreement.
            Among other things, signing providers commit to:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Administering vaccine at no out-of-pocket cost to the patient.
            </li>
            <li>
              Reporting any serious adverse event to VAERS, regardless of
              suspected causality.
            </li>
            <li>
              Reporting all vaccine administration data to the
              jurisdiction&apos;s immunization information system.
            </li>
            <li>
              Maintaining cold-chain handling and lot-tracking records.
            </li>
          </ul>
        </ExpandableCard>

        <ExpandableCard
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          title="How current is this data?"
          summary="The dataset scope, freshness, and known gaps."
          sourceUrl="https://vaers.hhs.gov/data.html"
        >
          <p>
            CheckVAERS searches a <span className="font-semibold">snapshot</span>{" "}
            of the public VAERS dataset, filtered to COVID-19 vaccine
            reports from approximately the last 7 years. The snapshot is
            prepared and refreshed periodically; the live VAERS database
            may contain reports that haven&apos;t yet propagated here.
          </p>
          <p>
            Two things to keep in mind:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              VAERS is voluntary for the general public — some adverse
              events go unreported entirely.
            </li>
            <li>
              A report in VAERS is not proof of causation. Researchers use
              VAERS to detect signals that warrant deeper study.
            </li>
          </ul>
        </ExpandableCard>
      </section>

      <p className="mt-8 mb-2 text-balance text-center text-xs text-muted-foreground">
        Sources: vaers.hhs.gov, hrsa.gov, cdc.gov. CheckVAERS is not
        affiliated with the CDC, FDA, or HHS.
      </p>
    </div>
  );
}
