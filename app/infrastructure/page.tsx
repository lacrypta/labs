import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import { StatusBadge } from "@/components/sections/Infrastructure";
import ServicesGrid from "./ServicesGrid";
import { Server, Zap, Copy } from "lucide-react";

export const metadata: Metadata = {
  title: "Infraestructura",
  description:
    "Infraestructura pública operada por La Crypta Labs — nodo Bitcoin, nodo Lightning, relay Nostr, servidor Blossom y más.",
};

export default function InfrastructurePage() {
  return (
    <>
      <PageHero
        eyebrow="INFRAESTRUCTURA PÚBLICA"
        eyebrowIcon={<Server className="h-3 w-3" />}
        title={
          <>
            Servicios abiertos de{" "}
            <span className="text-gradient-bitcoin">La Crypta Labs</span>
          </>
        }
        description="Nodos y relays de grado productivo operados por la comunidad, para la comunidad. Usalos gratis — simplemente no seas malvado."
      />

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesGrid />

          <div id="lightning" className="scroll-mt-24">
            <LightningNodeDetails />
          </div>

          <div id="bitcoin" className="mt-16 scroll-mt-24">
            <BitcoinNodeDetails />
          </div>
        </div>
      </section>
    </>
  );
}

function LightningNodeDetails() {
  return (
    <section>
      <div className="mb-8 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-lightning/30 bg-lightning/10 text-lightning">
          <Zap className="h-5 w-5" />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">
          Nodo Lightning
        </h2>
        <StatusBadge status="live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard label="Alias" value="lacrypta-labs" copy />
        <InfoCard label="Implementación" value="LND 0.18-beta" />
        <InfoCard label="Red" value="mainnet" />
        <InfoCard
          label="URI del nodo"
          value="03abcd...@ln.lacrypta.ar:9735"
          copy
          mono
          span={2}
        />
        <InfoCard label="Capacidad" value="~1.2 BTC outbound" />
        <InfoCard label="Canales activos" value="38" />
        <InfoCard label="Política de fees" value="1 sat + 0.001%" />
        <InfoCard label="Facturas sin monto" value="Soportadas" />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-background-card p-6">
        <h3 className="font-display font-bold mb-2">Abrí un canal con nosotros</h3>
        <p className="text-sm text-foreground-muted mb-4 max-w-2xl">
          Aceptamos pedidos de entrada de miembros de la comunidad que corran
          nodos reales. Usá la URI de arriba, o mandanos un zap por Nostr.
        </p>
        <div className="rounded-xl bg-black/40 border border-border p-4 font-mono text-xs sm:text-sm text-foreground overflow-x-auto">
          <div className="text-foreground-subtle"># vía lncli</div>
          <div>
            lncli openchannel --node_key=03abcd... --local_amt=5000000
          </div>
        </div>
      </div>
    </section>
  );
}

function BitcoinNodeDetails() {
  return (
    <section>
      <div className="mb-8 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-bitcoin/30 bg-bitcoin/10 text-bitcoin">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path d="M17.06 10.85c.88-.7 1.45-1.67 1.45-2.85 0-2.1-1.65-3.5-3.95-4v-2h-2v2h-1.5v-2h-2v2H7.06v2h1.5v10h-1.5v2h1.5v2h2v-2h1.5v2h2v-2c2.6-.3 4.95-1.6 4.95-4.3 0-1.4-.65-2.45-1.95-3.35zM10.56 6.05h3c.95 0 1.9.35 1.9 1.6 0 1.25-.95 1.6-1.9 1.6h-3v-3.2zm3.4 9.9H10.56v-3.3h3.4c1.15 0 2.2.4 2.2 1.65 0 1.25-1.05 1.65-2.2 1.65z" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight">
          Nodo Bitcoin
        </h2>
        <StatusBadge status="live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InfoCard label="Implementación" value="Bitcoin Core 28.0" />
        <InfoCard label="Red" value="mainnet" />
        <InfoCard label="Prune" value="archival" />
        <InfoCard label="Tamaño mempool" value="~300 MB" />
        <InfoCard label="Peers" value="256" />
        <InfoCard label="Uptime" value="99,98%" />
      </div>
    </section>
  );
}

function InfoCard({
  label,
  value,
  copy,
  mono,
  span,
}: {
  label: string;
  value: string;
  copy?: boolean;
  mono?: boolean;
  span?: number;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-border bg-background-card p-5 ${
        span === 2 ? "lg:col-span-2" : ""
      }`}
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-subtle mb-1.5">
        {label}
      </div>
      <div
        className={`font-semibold truncate ${
          mono ? "font-mono text-sm text-foreground" : "text-base"
        }`}
      >
        {value}
      </div>
      {copy && (
        <button
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground-subtle hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Copy"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
