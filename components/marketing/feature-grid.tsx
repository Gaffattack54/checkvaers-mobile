import {
  Lock,
  Smartphone,
  WifiOff,
  Database,
  UserX,
  Code,
} from "lucide-react";

const FEATURES = [
  {
    icon: Lock,
    title: "Truly private",
    body: "Matching runs in your browser. There is no server collecting your inputs. No account, no telemetry, no third-party scripts.",
  },
  {
    icon: Database,
    title: "Real VAERS data",
    body: "889,000+ COVID-19 reports filtered from the public HHS-published dataset. De-identified upstream by HHS before publication.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first PWA",
    body: "Installable to your home screen on iOS and Android. Looks native, behaves like the apps you already use.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Once the dataset is cached on your device (one-time, ~70 MB), checks run without a network connection.",
  },
  {
    icon: UserX,
    title: "No accounts",
    body: "No sign up, no password, no email. Past checks are saved locally to your device — you can delete them anytime.",
  },
  {
    icon: Code,
    title: "Open source",
    body: "Every line of the matcher and the data layer is on GitHub. Audit it yourself — the privacy story isn't marketing.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
            What makes it different
          </p>
          <h2 className="mt-3 text-balance text-3xl font-black tracking-tight text-brand-navy md:text-4xl">
            Built for trust. Not a marketing checkbox.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-brand-navy">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
