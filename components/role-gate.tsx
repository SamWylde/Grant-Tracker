"use client";

import { Paper, Text } from "@mantine/core";

import { useAuth, type OrgMembershipRole } from "./auth-context";

export function RoleGate({
  role,
  children,
  fallback = null,
  allowPlatformAdmins = true
}: {
  role: OrgMembershipRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowPlatformAdmins?: boolean;
}) {
  const { hasRole, isLoading, isPlatformAdmin } = useAuth();

  if (isLoading) {
    return (
      <Paper withBorder radius="md" p="md" variant="surfacePrimary">
        <Text size="sm" c="dimmed">
          Checking permissions…
        </Text>
      </Paper>
    );
  }

  if (allowPlatformAdmins && isPlatformAdmin) {
    return <>{children}</>;
  }

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
