import StandaloneProjectPage from "./StandaloneProjectPage";

// Route: /projects/[pubkey]/[projectId]
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: pubkey, projectId } = await params;
  return <StandaloneProjectPage pubkey={pubkey} projectId={projectId} />;
}
