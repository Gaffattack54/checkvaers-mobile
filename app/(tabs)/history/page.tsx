import { History as HistoryIcon } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-12">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
          <HistoryIcon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-navy">
          History
        </h1>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          Past checks performed on this device. History is stored locally only.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Local history is wired up in Step 9.
      </div>
    </div>
  );
}
