"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProgressDots } from "./progress-dots";

interface StepHeaderProps {
  /** 0-based step index. */
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  /** Override the default `router.back()` behavior — e.g. to go to the check tab root. */
  onBack?: () => void;
}

export function StepHeader({
  step,
  total,
  title,
  subtitle,
  onBack,
}: StepHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  return (
    <header className="pt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-brand-navy hover:bg-muted"
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </button>
        <ProgressDots current={step} total={total} />
        <span className="h-12 w-12" aria-hidden="true" />
      </div>
      <div className="mt-6">
        <h1 className="text-2xl font-black tracking-tight text-brand-navy">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-balance text-sm text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}

/** How many steps in the user-facing check flow (excluding loading + result). */
export const CHECK_FLOW_STEPS = 5;
