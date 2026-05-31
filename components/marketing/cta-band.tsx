import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="bg-brand-navy py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6 text-center md:px-10">
        <h2 className="text-balance text-3xl font-black tracking-tight text-white md:text-4xl">
          Ready to check?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-balance text-base text-white/70">
          Four quick questions. Nothing transmitted. Results in under ten
          seconds.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full px-8 sm:w-auto">
            <Link href="/check">
              Check VAERS now
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full bg-transparent text-white hover:bg-white/10 sm:w-auto"
          >
            <Link href="/learn">Read the background</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
