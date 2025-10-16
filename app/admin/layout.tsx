import type { Metadata } from "next";
import { headers } from "next/headers";

import { AdminAppShell } from "@/components/admin/admin-shell";
import { requireAdminContext } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Grant Tracker Admin Console"
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await requireAdminContext({ path: resolveRequestPath() });

  return <AdminAppShell context={context}>{children}</AdminAppShell>;
}

function resolveRequestPath(): string {
  try {
    const headerList = headers();
    const directPath = headerList.get("x-middleware-pathname") ?? headerList.get("x-pathname");
    if (directPath) {
      return directPath;
    }

    const urlValue = headerList.get("x-next-url") ?? headerList.get("x-request-url");
    if (urlValue) {
      try {
        return new URL(urlValue).pathname;
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }

  return "/admin";
}
