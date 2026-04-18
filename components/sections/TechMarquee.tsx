"use client";

const ITEMS = [
  "BITCOIN",
  "LIGHTNING",
  "NOSTR",
  "CÓDIGO ABIERTO",
  "AUTOCUSTODIA",
  "CYPHERPUNK",
  "NIP-05",
  "BOLT11",
  "TAPROOT",
  "SIGNET",
  "LNURL",
  "NIP-07",
  "PAYJOIN",
  "MINISCRIPT",
  "BLOSSOM",
];

export default function TechMarquee() {
  return (
    <section
      aria-hidden="true"
      className="relative py-10 border-y border-border bg-background-elevated/40 overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee whitespace-nowrap">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-10 px-6 font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground-subtle"
          >
            <span>{item}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-bitcoin shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
