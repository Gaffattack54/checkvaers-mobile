"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { US_STATES } from "@/lib/vaers/us-states";
import { useCheckDraft } from "@/lib/state/check-store";
import { Input } from "@/components/ui/input";
import { StepHeader, CHECK_FLOW_STEPS } from "@/components/check-flow/step-header";
import { cn } from "@/lib/utils";
import { VARIANT } from "@/lib/site-config";

const isSite = VARIANT === "site";

export default function StateStepPage() {
  const router = useRouter();
  const selected = useCheckDraft((s) => s.state);
  const setState = useCheckDraft((s) => s.setState);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_STATES;
    return US_STATES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q
    );
  }, [query]);

  const handlePick = (code: string) => {
    setState(code);
    // Smooth UX: short delay so the user sees the check land before navigating.
    setTimeout(() => router.push("/check/sex"), 120);
  };

  return (
    <div className={isSite ? "mx-auto flex w-full max-w-xl flex-1 flex-col" : "flex flex-1 flex-col px-6 pb-32"}>
      <StepHeader
        step={0}
        total={CHECK_FLOW_STEPS}
        title="What state are you in?"
        subtitle="We use this to narrow the VAERS search to your area."
        onBack={() => router.push("/check")}
      />

      <div className="mt-6">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search states"
          aria-label="Search states"
          autoComplete="off"
          autoCapitalize="words"
        />
      </div>

      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">
            No states match &ldquo;{query}&rdquo;.
          </li>
        ) : (
          filtered.map((s) => {
            const isSelected = s.code === selected;
            return (
              <li key={s.code}>
                <button
                  type="button"
                  onClick={() => handlePick(s.code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left min-h-tap transition-colors",
                    "hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-9 items-center justify-center rounded-md bg-muted text-xs font-bold tracking-wider text-brand-navy">
                      {s.code}
                    </span>
                    <span className="text-base text-brand-navy">{s.name}</span>
                  </span>
                  {isSelected ? (
                    <Check className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
