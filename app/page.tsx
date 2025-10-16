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

        <Stack gap="sm">
          <Title order={3} size="h4">
            Available pages
          </Title>
          <List spacing="md" withPadding>
            <List.Item>
              <Stack gap={2}>
                <Anchor component={Link} href="/login" fw={600}>
                  Sign in
                </Anchor>
                <Text size="sm" c="dimmed">
                  Email + password form backed by the Supabase client. Includes environment diagnostics and quick links once
                  you authenticate.
                </Text>
              </Stack>
            </List.Item>
            <List.Item>
              <Stack gap={2}>
                <Anchor component={Link} href="/my-tasks" fw={600}>
                  My tasks
                </Anchor>
                <Text size="sm" c="dimmed">
                  Personalized checklist view that surfaces grant tasks assigned to the signed-in user. Requires an active
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
                  Upload a spreadsheet of existing opportunities to pre-populate the workspace. Includes validation feedback.
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
