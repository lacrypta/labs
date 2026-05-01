import { Suspense } from "react";
import type { Metadata } from "next";
import UserProjectsClient from "./UserProjectsClient";

export const metadata: Metadata = {
  title: "Mis proyectos",
  description:
    "Tus proyectos, firmados con tu clave Nostr y guardados en relays abiertos.",
  robots: { index: false, follow: false },
};

export default function UserProjectsPage() {
  return (
    <Suspense>
      <UserProjectsClient />
    </Suspense>
  );
}
