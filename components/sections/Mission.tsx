"use client";

import { motion } from "framer-motion";
import { FlaskConical, Rocket, Globe2, Code2 } from "lucide-react";

const PILLARS = [
  {
    icon: FlaskConical,
    title: "Investigar",
    description:
      "Indagamos los problemas más difíciles del dinero y los protocolos abiertos — desde escalar Lightning hasta construir sobre Nostr — y publicamos lo que aprendemos.",
    color: "from-bitcoin/20 to-bitcoin/0",
    iconColor: "text-bitcoin",
    border: "border-bitcoin/20",
  },
  {
    icon: FlaskConical,
    title: "Prototipar",
    description:
      "Toda idea merece una demo funcional. Convertimos la investigación en prototipos que personas reales pueden usar, probar y romper.",
    color: "from-nostr/20 to-nostr/0",
    iconColor: "text-nostr",
    border: "border-nostr/20",
  },
  {
    icon: Rocket,
    title: "Lanzar",
    description:
      "Las mejores ideas se convierten en productos y servicios reales — probados en combate, mantenidos y compartidos con la comunidad.",
    color: "from-cyan/20 to-cyan/0",
    iconColor: "text-cyan",
    border: "border-cyan/20",
  },
  {
    icon: Globe2,
    title: "Enseñar",
    description:
      "Hackatones, talleres y documentación abierta — formamos a la próxima generación de builders soberanos en Argentina y más allá.",
    color: "from-lightning/20 to-lightning/0",
    iconColor: "text-lightning",
    border: "border-lightning/20",
  },
];

export default function Mission() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-white/5 text-xs font-mono tracking-wider text-foreground-muted mb-5"
          >
            <Code2 className="h-3 w-3" />
            NUESTRA MISIÓN
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
          >
            Un laboratorio para{" "}
            <span className="text-gradient-bitcoin">protocolos abiertos</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-foreground-muted leading-relaxed max-w-2xl"
          >
            La Crypta Dev es el brazo de I+D de{" "}
            <a
              href="https://lacrypta.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-bitcoin transition-colors underline decoration-bitcoin/40 underline-offset-4"
            >
              La Crypta
            </a>{" "}
            — una comunidad de fanáticos del software libre, cypherpunks y
            mentes curiosas. Amamos el código abierto. Creemos en la soberanía.
            Construimos en abierto.
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl border ${p.border} bg-background-card p-6 hover:scale-[1.02] transition-transform`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-50 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-background-elevated border ${p.border} ${p.iconColor} mb-4`}
                >
                  <p.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  {p.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
