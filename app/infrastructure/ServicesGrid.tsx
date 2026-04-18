"use client";

import { ServiceCard, SERVICES } from "@/components/sections/Infrastructure";

export default function ServicesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
      {SERVICES.map((s, i) => (
        <ServiceCard key={s.id} service={s} index={i} />
      ))}
    </div>
  );
}
