import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import ServicesGrid from "./ServicesGrid";
import { Server } from "lucide-react";

export const metadata: Metadata = {
  title: "Infraestructura",
  description:
    "Infraestructura pública operada por La Crypta Dev — nodo Bitcoin, nodo Lightning, relay Nostr, servidor Blossom y más.",
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
            <span className="text-gradient-bitcoin">La Crypta Dev</span>
          </>
        }
        description="Nodos y relays de grado productivo operados por la comunidad, para la comunidad. Usalos gratis — simplemente no seas malvado."
      />

      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesGrid />
        </div>
      </section>
    </>
  );
}
