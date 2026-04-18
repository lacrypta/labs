import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import HackathonsList from "./HackathonsList";
import { Code, Trophy, Users, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Hackatones",
  description:
    "Hackatones organizados por La Crypta Labs — Bitcoin, Lightning y Nostr. Premios reales, mentores reales, builders reales.",
};

export default function HackathonsPage() {
  return (
    <>
      <PageHero
        eyebrow="HACKATONES"
        eyebrowIcon={<Code className="h-3 w-3" />}
        title={
          <>
            Construí algo{" "}
            <span className="text-gradient-bitcoin">en 48 horas.</span>
          </>
        }
        description="Organizamos hackatones de alta intensidad sobre protocolos abiertos. Vení solo, salí con equipo, prototipo y nuevos amigos."
      />

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            <KpiCard
              value="12"
              label="Eventos realizados"
              icon={<Code className="h-5 w-5" />}
              bg={<Code className="h-32 w-32" />}
              accent="text-bitcoin"
            />
            <KpiCard
              value="300+"
              label="Builders participaron"
              icon={<Users className="h-5 w-5" />}
              bg={<Users className="h-32 w-32" />}
              accent="text-nostr"
            />
            <KpiCard
              value="10M"
              label="Sats repartidos"
              icon={<Trophy className="h-5 w-5" />}
              bg={<Trophy className="h-32 w-32" />}
              accent="text-lightning"
            />
            <KpiCard
              value="48h"
              label="Duración promedio"
              icon={<Zap className="h-5 w-5" />}
              bg={<Zap className="h-32 w-32" />}
              accent="text-cyan"
            />
          </div>
          <HackathonsList />
        </div>
      </section>
    </>
  );
}

function KpiCard({
  value,
  label,
  icon,
  bg,
  accent,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  bg: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background-card p-6">
      <div className="absolute -top-8 -right-8 opacity-5">{bg}</div>
      <div className={`mb-3 ${accent}`}>{icon}</div>
      <div className="font-display text-4xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-foreground-muted">{label}</div>
    </div>
  );
}
