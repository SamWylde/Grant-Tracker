import type { Metadata } from "next";

import { AdminAppShell } from "@/components/admin/admin-shell";
import { getAdminContext } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Grant Tracker Admin Console"
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await getAdminContext();

  return <AdminAppShell context={context}>{children}</AdminAppShell>;
}
