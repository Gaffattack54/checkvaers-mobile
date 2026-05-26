import { BookOpen } from "lucide-react";

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
          Plain-language background on VAERS, reporting rules, and this app&apos;s data.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Educational content is being prepared — coming in Step 7.
      </div>
    </div>
  );
}
