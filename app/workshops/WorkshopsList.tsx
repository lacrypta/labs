"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Clock, Globe, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/cn";

type Workshop = {
  id: string;
  title: string;
  level: "Principiante" | "Intermedio" | "Avanzado";
  topic: "bitcoin" | "lightning" | "nostr" | "crypto";
  duration: string;
  format: "presencial" | "online" | "híbrido";
  description: string;
  instructor: string;
  seats?: string;
  next?: string;
};

const WORKSHOPS: Workshop[] = [
  {
    id: "bitcoin-101",
    title: "Bitcoin 101 — Tu primer sat",
    level: "Principiante",
    topic: "bitcoin",
    duration: "3h",
    format: "híbrido",
    description:
      "Wallets, direcciones, fees, mempool. Salís con tus primeros sats, un backup que entendés y el coraje para gastarlos.",
    instructor: "Lucas M.",
    seats: "30 cupos",
    next: "26 Abr",
  },
  {
    id: "lightning-dev",
    title: "Lightning para desarrolladores",
    level: "Intermedio",
    topic: "lightning",
    duration: "6h · 2 sesiones",
    format: "híbrido",
    description:
      "BOLT11, BOLT12, LNURL y Nostr Wallet Connect — integraciones prácticas con LND y CLN.",
    instructor: "Ana P.",
    seats: "20 cupos",
    next: "3 May",
  },
  {
    id: "nostr-apps",
    title: "Construí una app Nostr en un finde",
    level: "Intermedio",
    topic: "nostr",
    duration: "8h · 2 sesiones",
    format: "híbrido",
    description:
      "Del repo en blanco a una app Nostr en producción — NIP-01, NIP-07, relays, zaps y deploy.",
    instructor: "Martín R.",
    seats: "25 cupos",
    next: "11 May",
  },
  {
    id: "self-custody",
    title: "Autocustodia, de cero a hardware",
    level: "Principiante",
    topic: "bitcoin",
    duration: "4h",
    format: "presencial",
    description:
      "Frases semilla, passphrases, multisig, hardware wallets. Con equipos reales en la mano.",
    instructor: "Clara G.",
    seats: "15 cupos",
    next: "18 May",
  },
  {
    id: "running-ln-node",
    title: "Operar un nodo Lightning",
    level: "Avanzado",
    topic: "lightning",
    duration: "6h",
    format: "presencial",
    description:
      "Elegí canales, administrá liquidez, mantenete online. Te vas con un plan y una guía para abrir.",
    instructor: "Tomás F.",
    seats: "12 cupos",
    next: "1 Jun",
  },
  {
    id: "crypto-primitives",
    title: "Criptografía para builders",
    level: "Intermedio",
    topic: "crypto",
    duration: "4h",
    format: "online",
    description:
      "Hashes, firmas, secp256k1, Schnorr. Justo la matemática necesaria, mucha intuición.",
    instructor: "Silvina O.",
    seats: "Abierto",
    next: "8 Jun",
  },
  {
    id: "taproot-miniscript",
    title: "Taproot y Miniscript",
    level: "Avanzado",
    topic: "bitcoin",
    duration: "5h",
    format: "presencial",
    description:
      "Diseñá políticas de gasto reales, escribí Miniscript, debuggealo en el mempool.",
    instructor: "Diego A.",
    seats: "15 cupos",
    next: "15 Jun",
  },
  {
    id: "nip46-bunker",
    title: "NIP-46 firma remota a fondo",
    level: "Avanzado",
    topic: "nostr",
    duration: "3h",
    format: "online",
    description:
      "Arquitectura, modelo de amenazas y una implementación de referencia de un firmante remoto de Nostr.",
    instructor: "Federico L.",
    seats: "Abierto",
    next: "22 Jun",
  },
];

const TOPIC_STYLE: Record<Workshop["topic"], string> = {
  bitcoin: "bg-bitcoin/10 text-bitcoin border-bitcoin/30",
  lightning: "bg-lightning/10 text-lightning border-lightning/30",
  nostr: "bg-nostr/10 text-nostr border-nostr/30",
  crypto: "bg-cyan/10 text-cyan border-cyan/30",
};

const LEVEL_STYLE: Record<Workshop["level"], string> = {
  Principiante: "bg-success/10 text-success border-success/30",
  Intermedio: "bg-cyan/10 text-cyan border-cyan/30",
  Avanzado: "bg-nostr/10 text-nostr border-nostr/30",
};

const TOPICS: { id: Workshop["topic"] | "all"; label: string }[] = [
  { id: "all", label: "Todos los temas" },
  { id: "bitcoin", label: "Bitcoin" },
  { id: "lightning", label: "Lightning" },
  { id: "nostr", label: "Nostr" },
  { id: "crypto", label: "Cripto" },
];

export default function WorkshopsList() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["id"]>("all");
  const filtered =
    topic === "all" ? WORKSHOPS : WORKSHOPS.filter((w) => w.topic === topic);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-10">
        {TOPICS.map((t) => {
          const active = topic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTopic(t.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all",
                active
                  ? "bg-nostr text-white shadow-lg shadow-nostr/20"
                  : "bg-white/[0.03] text-foreground-muted border border-border hover:bg-white/[0.06] hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-background-card p-6 hover:border-border-strong hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-widest",
                  TOPIC_STYLE[w.topic],
                )}
              >
                {w.topic}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-widest",
                  LEVEL_STYLE[w.level],
                )}
              >
                {w.level}
              </span>
            </div>

            <h3 className="font-display text-lg font-bold tracking-tight mb-2">
              {w.title}
            </h3>
            <p className="text-sm text-foreground-muted leading-relaxed line-clamp-3">
              {w.description}
            </p>

            <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-foreground-muted">
                <Clock className="h-3.5 w-3.5 opacity-60" />
                {w.duration}
              </div>
              <div className="flex items-center gap-1.5 text-foreground-muted">
                {w.format === "online" ? (
                  <Globe className="h-3.5 w-3.5 opacity-60" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 opacity-60" />
                )}
                {w.format}
              </div>
              <div className="flex items-center gap-1.5 text-foreground-muted">
                <Users className="h-3.5 w-3.5 opacity-60" />
                {w.seats ?? "Abierto"}
              </div>
              <div className="text-foreground-muted font-mono">
                Próximo: <span className="text-foreground">{w.next}</span>
              </div>
            </div>

            <button className="mt-5 w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-white/[0.02] text-sm font-semibold group-hover:bg-white/[0.06] transition-colors">
              <span>Reservar lugar</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
