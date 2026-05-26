import { FilePlus2 } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-12">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <FilePlus2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy">
          File a report
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          A guided checklist for filing your own VAERS report.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        The guided report flow is coming in Step 8.
      </div>
    </div>
  );
}
