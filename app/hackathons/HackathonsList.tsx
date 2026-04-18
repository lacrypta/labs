"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/cn";

type Hackathon = {
  slug: string;
  name: string;
  date: string;
  iso: string;
  location: string;
  status: "upcoming" | "past";
  theme: string;
  description: string;
  prize?: string;
  participants?: string;
  winner?: string;
  accent: "bitcoin" | "lightning" | "nostr" | "cyan";
};

const ACCENT: Record<Hackathon["accent"], string> = {
  bitcoin: "from-bitcoin/30 to-transparent border-bitcoin/30 text-bitcoin",
  lightning:
    "from-lightning/30 to-transparent border-lightning/30 text-lightning",
  nostr: "from-nostr/30 to-transparent border-nostr/30 text-nostr",
  cyan: "from-cyan/30 to-transparent border-cyan/30 text-cyan",
};

const UPCOMING: Hackathon[] = [
  {
    slug: "la-crypta-summer-2026",
    name: "La Crypta Summer Hackathon",
    date: "14 – 16 Jun 2026",
    iso: "2026-06-14",
    location: "Buenos Aires · Argentina",
    status: "upcoming",
    theme: "Nostr × IA — agentes con pago por pensamiento",
    description:
      "Un sprint de 48 horas para construir agentes de IA nativos en Nostr que pueden ganar y gastar sats de forma autónoma. Traé tu LLM, nosotros ponemos la plumbería.",
    prize: "5.000.000 sats + mentoría",
    accent: "bitcoin",
  },
];

const PAST: Hackathon[] = [
  {
    slug: "lawallet-jam-2025",
    name: "LaWallet Jam",
    date: "22 – 24 Nov 2025",
    iso: "2025-11-22",
    location: "Buenos Aires",
    status: "past",
    theme: "Extensiones y mini-apps para LaWallet",
    description:
      "Los hackers construyeron 17 nuevos plugins para LaWallet en un finde — desde integraciones POS hasta juegos de zaps.",
    participants: "82 builders, 17 equipos",
    winner: "🏆 ZapCrawler — una búsqueda del tesoro por proof-of-zap",
    accent: "nostr",
  },
  {
    slug: "lightning-games-2025",
    name: "Lightning Games",
    date: "7 – 9 Jun 2025",
    iso: "2025-06-07",
    location: "Buenos Aires",
    status: "past",
    theme: "Juegos multijugador nativos en Lightning",
    description:
      "48 horas, 9 juegos multijugador con sats como economía. Algunos se siguen jugando hoy.",
    participants: "64 builders, 14 equipos",
    winner: "🏆 Sat Chess — ajedrez con apuesta por movida sobre Lightning",
    accent: "lightning",
  },
  {
    slug: "nostrathon-2024",
    name: "Nostr-a-thon",
    date: "12 – 14 Oct 2024",
    iso: "2024-10-12",
    location: "Buenos Aires",
    status: "past",
    theme: "Apps sociales sobre Nostr",
    description:
      "Un fin de semana de experimentos con NIP-23, NIP-51 y zaps. Varios proyectos se siguen manteniendo.",
    participants: "95 builders, 19 equipos",
    winner: "🏆 CryptaBook — agenda social sobre Nostr",
    accent: "cyan",
  },
  {
    slug: "btc-builders-2024",
    name: "BTC Builders Weekend",
    date: "18 – 20 May 2024",
    iso: "2024-05-18",
    location: "Buenos Aires",
    status: "past",
    theme: "Bitcoin-only / soberanía",
    description:
      "Hardware wallets, wallets miniscript, herramientas de coinjoin — todo lo que haga más fácil la autocustodia.",
    participants: "70 builders, 11 equipos",
    winner: "🏆 Silent Payments Toolkit",
    accent: "bitcoin",
  },
];

export default function HackathonsList() {
  return (
    <div className="space-y-14">
      <Group title="Próximos" subtitle="Registrate temprano, los cupos son limitados">
        {UPCOMING.map((h, i) => (
          <HackathonCard key={h.slug} hackathon={h} index={i} featured />
        ))}
      </Group>

      <Group
        title="Ediciones anteriores"
        subtitle="Una pequeña muestra — mirá GitHub para ver ganadores y código"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAST.map((h, i) => (
            <HackathonCard key={h.slug} hackathon={h} index={i} />
          ))}
        </div>
      </Group>
    </div>
  );
}

function Group({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function HackathonCard({
  hackathon,
  index,
  featured = false,
}: {
  hackathon: Hackathon;
  index: number;
  featured?: boolean;
}) {
  const accent = ACCENT[hackathon.accent];
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-background-card",
        "border-border hover:border-border-strong transition-colors",
        featured && "md:p-0",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none",
          accent,
        )}
      />
      <div
        className={cn(
          "relative p-6",
          featured && "md:p-8 md:grid md:grid-cols-[1fr_auto] md:gap-8 md:items-center",
        )}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold tracking-widest",
                accent,
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {hackathon.status === "upcoming" ? "PRÓXIMO" : "PASADO"}
            </span>
            <span className="text-xs font-mono text-foreground-muted">
              {hackathon.date}
            </span>
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">
            {hackathon.name}
          </h3>
          <p className="text-base font-semibold text-foreground-muted mb-3">
            {hackathon.theme}
          </p>
          <p className="text-sm text-foreground-muted leading-relaxed max-w-xl">
            {hackathon.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-foreground-muted">
              <MapPin className="h-3.5 w-3.5 opacity-60" />
              {hackathon.location}
            </span>
            {hackathon.prize && (
              <span className="inline-flex items-center gap-1.5 text-lightning font-mono">
                <Trophy className="h-3.5 w-3.5" />
                {hackathon.prize}
              </span>
            )}
            {hackathon.participants && (
              <span className="inline-flex items-center gap-1.5 text-foreground-muted">
                <Users className="h-3.5 w-3.5 opacity-60" />
                {hackathon.participants}
              </span>
            )}
          </div>

          {hackathon.winner && (
            <div className="mt-4 text-sm font-mono text-foreground-muted">
              {hackathon.winner}
            </div>
          )}
        </div>

        {featured && (
          <div className="mt-6 md:mt-0">
            <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-bitcoin to-yellow-500 text-black font-semibold text-sm shadow-lg shadow-bitcoin/20 hover:shadow-bitcoin/40 hover:scale-[1.02] transition-all">
              Registrate ahora
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
