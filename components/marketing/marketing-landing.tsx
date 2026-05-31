import { SiteHeader } from "./site-header";
import { MarketingHero } from "./hero";
import { StatsBar } from "./stats-bar";
import { HowItWorks } from "./how-it-works";
import { FeatureGrid } from "./feature-grid";
import { MarketingFaq } from "./faq";
import { CtaBand } from "./cta-band";
import { SiteFooter } from "./site-footer";

export function MarketingLanding() {
  return (
    <>
      <SiteHeader />
      <main>
        <MarketingHero />
        <StatsBar />
        <HowItWorks />
        <FeatureGrid />
        <MarketingFaq />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
