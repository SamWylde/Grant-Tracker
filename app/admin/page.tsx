"use client";

import Link from "next/link";

import {
  Anchor,
  Badge,
  Card,
  Grid,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
  Title
} from "@mantine/core";
import { IconArrowRight, IconDatabase, IconHistory, IconUsers } from "@tabler/icons-react";

const quickLinks = [
  {
    title: "Run a SQL query",
    description: "Inspect data or troubleshoot records directly in Postgres.",
    href: "/admin/sql",
    icon: IconDatabase
  },
  {
    title: "Review audit logs",
    description: "Monitor recent admin actions and suspicious activity.",
    href: "/admin/audit",
    icon: IconHistory
  },
  {
    title: "Manage users",
    description: "Promote platform admins, reset passwords, and deactivate accounts.",
    href: "/admin/users",
    icon: IconUsers
  }
];

export default function AdminDashboardPage() {
  return (
    <Stack gap="xl" p="md">
      <Stack gap={4}>
        <Group gap="sm">
          <Title order={2}>Admin control center</Title>
          <Badge color="midnight" variant="light">
            Preview
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          Secure tooling for platform administrators to inspect data, test integrations, and keep the system healthy.
          Feature development is ongoing—expect rapid iteration.
        </Text>
      </Stack>

      <Grid gutter="lg">
        {quickLinks.map((link) => (
          <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={link.href}>
            <Card withBorder padding="lg" radius="lg" h="100%">
              <Stack gap="md" justify="space-between" h="100%">
                <Group gap="sm">
                  <ThemeIcon size={36} radius="md" variant="light" color="midnight">
                    <link.icon size={18} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Anchor component={Link} href={link.href} fw={600}>
                      {link.title}
                    </Anchor>
                    <Text size="sm" c="dimmed">
                      {link.description}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="xs">
                  <Anchor component={Link} href={link.href} size="sm" c="midnight.2">
                    Open section
                  </Anchor>
                  <IconArrowRight size={16} />
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Card withBorder padding="lg" radius="lg">
        <Stack gap="sm">
          <Title order={4}>Launch checklist</Title>
          <Text size="sm" c="dimmed">
            Before enabling the admin panel in production, confirm the following hard requirements are satisfied.
          </Text>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>Supabase service role credentials are configured on the server.</List.Item>
            <List.Item>platform_admins table is seeded with at least one trusted administrator.</List.Item>
            <List.Item>Admin audit log retention policy is configured for compliance.</List.Item>
            <List.Item>Rate limiting is enforced on all admin API routes.</List.Item>
          </List>
        </Stack>
      </Card>
    </Stack>
  );
}
