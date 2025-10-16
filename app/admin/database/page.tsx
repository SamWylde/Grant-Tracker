"use client";

import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

const INSIGHTS = [
  {
    title: "Table catalog",
    description:
      "Inspect tables, row counts, indexes, and relationships. Click a table to preview the first 100 rows with pagination controls."
  },
  {
    title: "RLS policies",
    description:
      "Quickly identify which tables enforce row-level security and confirm that service-role access is available for diagnostics."
  },
  {
    title: "Schema search",
    description:
      "Filter tables by name or column to speed up debugging across Supabase migrations and application code."
  }
];

export default function AdminDatabasePage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Database explorer
        </Title>
        <Text size="sm" c="dimmed">
          Browse Supabase schema metadata, inspect table contents, and run guided diagnostics on indexes, foreign keys, and
          row-level security policies.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {INSIGHTS.map((insight) => (
          <Paper key={insight.title} withBorder radius="lg" p="lg" variant="surfacePrimary">
            <Stack gap="sm">
              <Title order={4} size="h5">
                {insight.title}
              </Title>
              <Text size="sm" c="dimmed">
                {insight.description}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder radius="lg" p="lg" variant="surfaceSunken">
        <Stack gap="sm">
          <Title order={4} size="h5">
            Coming soon
          </Title>
          <Text size="sm" c="dimmed">
            The explorer surface will stream schema metadata from the Supabase catalog views and provide quick actions to view
            recent migrations, applied policies, and storage usage per table.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
