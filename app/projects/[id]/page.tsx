import UserProjectsPage from "./UserProjectsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pubkey } = await params;
  return <UserProjectsPage pubkey={pubkey} />;
}
