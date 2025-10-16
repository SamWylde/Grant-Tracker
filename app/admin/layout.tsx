import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminAccess } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin | Grant Tracker",
  description: "Administrative controls for the Grant Tracker platform"
};

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const access = await requireAdminAccess();

  if (!access.isAuthorized || !access.user) {
    const reason = access.reason ?? "unauthorized";
    redirect(`/dashboard?admin_error=${encodeURIComponent(reason)}`);
  }

  return (
    <AdminShell
      currentUser={access.user}
      isPlatformAdmin={Boolean(access.isPlatformAdmin)}
      organizations={access.organizations ?? []}
    >
      {children}
    </AdminShell>
  );
}
