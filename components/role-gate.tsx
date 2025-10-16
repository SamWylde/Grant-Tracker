"use client";

import { Paper, Text } from "@mantine/core";

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
      <Paper withBorder radius="md" p="md" variant="surfacePrimary">
        <Text size="sm" c="dimmed">
          Checking permissions…
        </Text>
      </Paper>
    );
  }

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
