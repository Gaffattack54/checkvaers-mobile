"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableCardProps {
  title: string;
  /** Optional short subtitle / one-liner shown when collapsed. */
  summary?: string;
  /** Icon shown in the colored tile to the left of the title. */
  icon?: ReactNode;
  /** Body content, revealed when the card is expanded. */
  children: ReactNode;
  /** "View official source" link. Opens in a new tab. */
  sourceUrl?: string;
  sourceLabel?: string;
  /** Force-open state (e.g. when first card should be open by default). */
  defaultOpen?: boolean;
}

export function ExpandableCard({
  title,
  summary,
  icon,
  children,
  sourceUrl,
  sourceLabel = "View official source",
  defaultOpen = false,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left min-h-tap"
      >
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-brand-navy">
            {title}
          </span>
          {summary ? (
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {summary}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border bg-background px-4 py-4 text-sm leading-relaxed text-brand-navy">
          {children}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan hover:underline"
            >
              {sourceLabel}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
