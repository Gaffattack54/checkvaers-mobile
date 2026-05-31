import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";
import { CONTACT_EMAIL, REPO_URL } from "@/lib/site-config";

export function SiteFooter() {
  const year = 2026; // intentionally static — no Date.now in render

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-brand-navy"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-base font-black tracking-tight">
                CheckVAERS
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Private, on-device search of public VAERS COVID-19 reports.
              Not affiliated with the CDC, FDA, or HHS. Not medical advice.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-brand-navy hover:bg-brand-cyan hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .5C5.6.5.5 5.7.5 12.1c0 5.1 3.3 9.4 7.9 11 .6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.6 7.9-5.9 7.9-11C23.5 5.7 18.4.5 12 .5z" />
                </svg>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-brand-navy hover:bg-brand-cyan hover:text-white"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Product
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <FooterLink href="/check">Check VAERS</FooterLink>
              <FooterLink href="/learn">Learn</FooterLink>
              <FooterLink href="/report">File a report</FooterLink>
              <FooterLink href="/history">History</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              About
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <FooterLink href="/about">About CheckVAERS</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href={REPO_URL} external>
                Source code
              </FooterLink>
              <FooterLink
                href="https://vaers.hhs.gov/data.html"
                external
              >
                Official VAERS data
              </FooterLink>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {year} CheckVAERS. Operates on HHS-published, de-identified data.</p>
          <p>No PHI processed. No personal data transmitted.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  external = false,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-brand-cyan"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="text-muted-foreground hover:text-brand-cyan"
      >
        {children}
      </Link>
    </li>
  );
}
