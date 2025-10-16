"use client";

import { Suspense, useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { Card, Container, List, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";

function mapError(code: string | null): { title: string; message: string } | null {
  switch (code) {
    case "not-authenticated":
      return {
        title: "Sign in required",
        message: "Authenticate with Supabase before accessing the admin console."
      };
    case "insufficient-role":
      return {
        title: "Admin access denied",
        message: "You must be an organization admin or platform admin to open /admin."
      };
    case "not-configured":
      return {
        title: "Admin panel disabled",
        message: "Supabase service role credentials are missing. Configure them to enable admin tooling."
      };
    default:
      return code
        ? {
            title: "Admin access blocked",
            message: "You do not have permission to view the requested page."
          }
        : null;
  }
}

function DashboardContent() {
  const params = useSearchParams();
  const error = params.get("admin_error");

  useEffect(() => {
    const payload = mapError(error);
    if (payload) {
      notifications.show({
        title: payload.title,
        message: payload.message,
        color: "red"
      });
    }
  }, [error]);

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>Dashboard</Title>
          <Text size="sm" c="dimmed">
            This lightweight dashboard is a landing page for authenticated users. Use the navigation items below to jump into the product.
          </Text>
        </Stack>
        <Card withBorder radius="lg" padding="lg">
          <Stack gap="sm">
            <Title order={4}>Quick links</Title>
            <List spacing="sm" size="sm" withPadding>
              <List.Item>My tasks — review your assigned grant checklist items.</List.Item>
              <List.Item>Grant workspace — open any saved grant at /grants/&lt;id&gt;.</List.Item>
              <List.Item>Admin console — available to platform and organization admins at /admin.</List.Item>
            </List>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
