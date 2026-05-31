import { MapPin, User, Calendar, Search } from "lucide-react";

const STEPS = [
  {
    n: 1,
    icon: MapPin,
    title: "Your state",
    body: "Pick where you were vaccinated. VAERS only stores the state, not your address.",
  },
  {
    n: 2,
    icon: User,
    title: "Sex & date of birth",
    body: "Used to calculate age. Both stay on your device — never transmitted.",
  },
  {
    n: 3,
    icon: Calendar,
    title: "Vaccine dose date(s)",
    body: "Up to five doses. The matcher catches any dose within ±7 days of a reported VAERS event.",
  },
  {
    n: 4,
    icon: Search,
    title: "Search & review",
    body: "We compare against 889k records in milliseconds. Results split into exact and partial matches.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
          How it works
        </p>
        <h2 className="mt-3 text-balance text-3xl font-black tracking-tight text-brand-navy md:text-4xl">
          Four questions. Under ten seconds. No data leaves your device.
        </h2>
        <p className="mt-4 text-balance text-base text-muted-foreground">
          CheckVAERS searches a pre-prepared snapshot of the public VAERS
          dataset. Everything runs in your browser.
        </p>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ n, icon: Icon, title, body }) => (
          <li
            key={n}
            className="relative rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-black text-3xl text-muted-foreground/30 tabular-nums">
                {n}
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold text-brand-navy">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
