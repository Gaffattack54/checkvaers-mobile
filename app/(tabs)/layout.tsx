import { BottomTabs } from "@/components/shared/bottom-tabs";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VARIANT } from "@/lib/site-config";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SITE variant: marketing chrome (top nav + footer), wider content
  // container. The pages themselves still render their mobile-shaped UI
  // (the check flow steps, learn cards, etc.), but in a desktop-friendly
  // frame instead of a phone-shaped column with a fixed bottom bar.
  if (VARIANT === "site") {
    return (
      <>
        <SiteHeader />
        <main className="relative bg-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-brand-cyan/[0.04] to-transparent"
          />
          <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10 md:py-16">
            {children}
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  // APP variant: mobile-first phone-shaped column with persistent bottom
  // tab nav, hex pattern background. The original behavior.
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hex-pattern bg-repeat opacity-[0.04]" />
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomTabs />
    </div>
  );
}
