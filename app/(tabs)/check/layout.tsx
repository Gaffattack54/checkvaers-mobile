import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check VAERS",
  description:
    "Search 889,000+ public COVID-19 VAERS reports for one matching your state, sex, age, and vaccination date. Matching runs on your device — no personal data is transmitted.",
};

export default function CheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
