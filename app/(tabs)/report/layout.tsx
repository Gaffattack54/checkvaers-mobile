import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "File a report",
  description:
    "A guided checklist for filing your own VAERS report. CheckVAERS deep-links to the official VAERS form at vaers.hhs.gov — submissions go directly to HHS, not through us.",
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
