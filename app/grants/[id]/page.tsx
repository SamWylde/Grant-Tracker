import { GrantDetailView } from "@/components/grant-detail-view";

export default function GrantDetailPage({
  params
}: {
  params: { id: string };
}) {
  const decodedId = decodeURIComponent(params.id);

  return (
    <div className="min-h-screen bg-slate-950">
      <GrantDetailView grantId={decodedId} />
    </div>
  );
}
