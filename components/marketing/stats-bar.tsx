export function StatsBar() {
  return (
    <section className="border-y border-border bg-brand-navy text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4 md:px-10 md:py-12">
        <Stat value="889K+" label="VAERS reports" />
        <Stat value="56" label="States &amp; territories" />
        <Stat value="2020–25" label="Years covered" />
        <Stat value="0" label="Accounts or trackers" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center md:text-left">
      <p className="font-black text-3xl tracking-tight text-brand-cyan md:text-4xl">
        {value}
      </p>
      <p
        className="mt-1 text-xs uppercase tracking-[0.16em] text-white/70"
        dangerouslySetInnerHTML={{ __html: label }}
      />
    </div>
  );
}
