'use client';

import { GrantDetailView } from "@/components/grant-detail-view";
import { RoleGate } from "@/components/role-gate";

export default function GrantDetailPage({
  params
}: {
  params: { id: string };
}) {
  const decodedId = decodeURIComponent(params.id);

  return (
    <div className="min-h-screen bg-slate-950">
      <RoleGate
        role="contributor"
        fallback={
          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center text-slate-200">
            <h1 className="text-2xl font-semibold text-white">Access requires a grant workspace seat</h1>
            <p className="text-sm text-slate-400">
              Ask an admin to invite you to the organization or accept your pending invite from email.
            </p>
          </div>
        }
      >
        <GrantDetailView grantId={decodedId} />
      </RoleGate>
    </div>
  );
}
