"use client";

import { useAuth, type OrgMembershipRole } from "./auth-context";

export function RoleGate({
  role,
  children,
  fallback = null
}: {
  role: OrgMembershipRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
        Checking permissions…
      </div>
    );
  }

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
