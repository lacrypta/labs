import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tu perfil de Nostr en La Crypta Labs.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
