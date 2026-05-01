import type { Metadata } from "next";
import UserProjectsPage from "./UserProjectsPage";

export const metadata: Metadata = {
  title: "Proyectos del usuario",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ pubkey: string }>;
}) {
  const { pubkey } = await params;
  return <UserProjectsPage pubkey={pubkey} />;
}
