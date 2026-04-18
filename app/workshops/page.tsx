import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import WorkshopsList from "./WorkshopsList";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Talleres",
  description:
    "Talleres gratuitos sobre Bitcoin, Lightning, Nostr y criptografía — dictados por la gente que los construye.",
};

export default function WorkshopsPage() {
  return (
    <>
      <PageHero
        eyebrow="TALLERES"
        eyebrowIcon={<GraduationCap className="h-3 w-3" />}
        title={
          <>
            Aprendé <span className="text-gradient-nostr">haciendo.</span>
          </>
        }
        description="Talleres prácticos para todos los niveles — desde tu primera transacción hasta operar tu propio nodo Lightning. Gratis, abiertos y grabados."
      />
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WorkshopsList />
        </div>
      </section>
    </>
  );
}
