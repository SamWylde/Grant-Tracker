"use client";

import Link from "next/link";

import { Anchor, Badge, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

const QUICK_LINKS = [
  {
    title: "Run SQL query",
    description: "Inspect production data with automatic row limits and audit logging.",
    href: "/admin/sql",
    badge: "Beta"
  },
  {
    title: "Browse database",
    description: "Inspect schema metadata, row counts, and RLS policies.",
    href: "/admin/database"
  },
  {
    title: "Test Grants.gov API",
    description: "Validate search filters and response payloads for opportunity syncs.",
    href: "/admin/api-test/grants-gov"
  },
  {
    title: "Monitor system",
    description: "Check background jobs, health checks, and integration status.",
    href: "/admin/system"
  }
];

export default function AdminDashboardPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Platform control center
        </Title>
        <Text size="sm" c="dimmed">
          Secure tools for platform operators to manage organizations, run diagnostics, and keep the Grant Tracker service
          healthy.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {QUICK_LINKS.map((link) => (
          <Paper key={link.href} withBorder radius="lg" p="lg" variant="surfacePrimary">
            <Stack gap="sm">
              <Group justify="space-between">
                <Anchor component={Link} href={link.href} fw={600} size="lg">
                  {link.title}
                </Anchor>
                {link.badge && (
                  <Badge variant="light" color="teal" radius="md">
                    {link.badge}
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {link.description}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder radius="lg" p="lg" variant="surfaceSunken">
        <Stack gap="sm">
          <Title order={4} size="h5">
            Security highlights
          </Title>
          <Text size="sm" c="dimmed">
            Access to this console is restricted to organization admins and elevated platform administrators. All actions are
            logged to the audit trail for compliance review, and potentially destructive queries require confirmation.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
