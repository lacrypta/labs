import type { Metadata } from "next";
import StandaloneProjectPage from "./StandaloneProjectPage";

export const metadata: Metadata = {
  title: "Proyecto",
  robots: { index: false, follow: false },
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ pubkey: string; id: string }>;
}) {
  const { pubkey, id: projectId } = await params;
  return <StandaloneProjectPage pubkey={pubkey} projectId={projectId} />;
}
