"use client";

import Link from "next/link";

import { Anchor, Container, List, Stack, Text, Title } from "@mantine/core";

export default function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>Grant Tracker prototype</Title>
          <Text size="sm" c="dimmed">
            This sandbox focuses on the internal workspace flows for tracking grants. Use the links below to jump straight
            into the current screens while Supabase auth and seed data are configured locally.
          </Text>
        </Stack>

        <Stack gap="lg">
          <Stack gap="sm">
            <Title order={3} size="h4">
              Workspace flows
            </Title>
            <List spacing="md" withPadding>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/dashboard" fw={600}>
                    Dashboard
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Landing view for signed-in users with guidance for navigating the workspace and quick links to common
                    actions.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/login" fw={600}>
                    Sign in
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Email + password form backed by the Supabase client, environment diagnostics, and shortcuts that unlock
                    after you authenticate.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/my-tasks" fw={600}>
                    My tasks
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Personalized checklist view surfacing grant tasks assigned to the signed-in user. Requires an active
                    session.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/grants/new" fw={600}>
                    Add a manual grant
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Capture off-platform opportunities with stages, priority, owner, notes, and optional checklist items.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/grants/import" fw={600}>
                    Import grants from CSV
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Upload a spreadsheet of existing opportunities to pre-populate the workspace with validation feedback on
                    parsing.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Text fw={600}>Grant detail workspace</Text>
                  <Text size="sm" c="dimmed">
                    Navigate to <Text component="span" fw={600}>/grants/&lt;grant-id&gt;</Text> after saving a grant to manage
                    milestones, reminders, attachments, and checklist tasks within the full detail view.
                  </Text>
                </Stack>
              </List.Item>
            </List>
          </Stack>

          <Stack gap="sm">
            <Title order={3} size="h4">
              Admin console
            </Title>
            <List spacing="md" withPadding>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin" fw={600}>
                    Platform control center
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Secure landing hub for elevated operators with quick links into SQL tooling, diagnostics, API tests, and
                    system monitoring.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/orgs" fw={600}>
                    Organization directory
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Preview organization metrics, membership counts, subscription tiers, and recent activity for each tenant.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/users" fw={600}>
                    User management
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Search Supabase auth users, review organization memberships, and stage account actions like resets or role
                    changes.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/audit" fw={600}>
                    Audit log
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Central feed capturing admin interactions, SQL execution, and potentially destructive operations for
                    compliance reviews.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/database" fw={600}>
                    Database explorer
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Browse Supabase schema metadata, review row counts, inspect RLS policies, and plan diagnostics on indexes
                    and foreign keys.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/system" fw={600}>
                    System health
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Monitor database, authentication, and integration health checks alongside upcoming job queue status
                    surfacing.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/sql" fw={600}>
                    SQL workbench
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Run service-role SQL queries with history, favorites, CSV export, confirmation flows, and pagination on
                    results.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/docs" fw={600}>
                    Admin guide
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Reference material covering console capabilities, API endpoints, security practices, and onboarding
                    guidance for administrators.
                  </Text>
                </Stack>
              </List.Item>
            </List>
          </Stack>

          <Stack gap="sm">
            <Title order={3} size="h4">
              Integration sandboxes
            </Title>
            <List spacing="md" withPadding>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/api-test/grants-gov" fw={600}>
                    Grants.gov tester
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Validate API keys, payload filters, and response handling with history, quick presets, JSON export, and
                    parsed opportunity tables.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/api-test/stripe" fw={600}>
                    Stripe integration checks
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Planned interface for inspecting products, reviewing subscription events, and simulating webhook payloads
                    using connected Stripe credentials.
                  </Text>
                </Stack>
              </List.Item>
              <List.Item>
                <Stack gap={2}>
                  <Anchor component={Link} href="/admin/api-test/email" fw={600}>
                    Email & SMS sandbox
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    Configure Postmark or Twilio to test transactional messages with previews, tagging each send in the audit
                    log for traceability.
                  </Text>
                </Stack>
              </List.Item>
            </List>
          </Stack>
        </Stack>

        <Stack gap={4}>
          <Title order={3} size="h4">
            Need credentials?
          </Title>
          <Text size="sm" c="dimmed">
            Create a Supabase project and populate the grant tables, or wire up the provided demo environment variables in
            <Text component="span" fw={600}> .env.local</Text>. Without Supabase configured, the UI falls back to mocked data
            for exploration.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
