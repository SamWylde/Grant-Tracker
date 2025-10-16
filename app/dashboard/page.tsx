"use client";

import Link from "next/link";

import { Anchor, Paper, Stack, Text, Title } from "@mantine/core";

export default function DashboardPage() {
  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Title order={2}>Welcome back</Title>
        <Text size="sm" c="dimmed">
          Use the navigation to access your grants workspace. Admins can open the /admin console for platform-level tools.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
        <Stack gap="sm">
          <Title order={4} size="h5">
            Quick links
          </Title>
          <Anchor component={Link} href="/my-tasks" fw={600}>
            View my tasks
          </Anchor>
          <Anchor component={Link} href="/grants" fw={600}>
            Browse grants
          </Anchor>
        </Stack>
      </Paper>
    </Stack>
  );
}
