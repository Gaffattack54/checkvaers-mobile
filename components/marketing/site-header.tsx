import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 md:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-navy"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base font-black tracking-tight">
            CheckVAERS
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            href="/learn"
            className="text-brand-navy/70 hover:text-brand-cyan"
          >
            Learn
          </Link>
          <Link
            href="/report"
            className="text-brand-navy/70 hover:text-brand-cyan"
          >
            File a report
          </Link>
          <Link
            href="/about"
            className="text-brand-navy/70 hover:text-brand-cyan"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-brand-navy/70 hover:text-brand-cyan"
          >
            Privacy
          </Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/check">Check VAERS</Link>
        </Button>
      </div>
    </header>
  );
}
