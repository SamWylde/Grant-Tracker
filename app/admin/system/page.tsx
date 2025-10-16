"use client";

import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

const CHECKS = [
  {
    title: "Database",
    description: "Verify Supabase connectivity, connection counts, and cache hit rates."
  },
  {
    title: "Auth",
    description: "Confirm Supabase Auth health, JWT validity, and 2FA enrollment for platform admins."
  },
  {
    title: "External APIs",
    description: "Monitor Grants.gov, Stripe, and Postmark/Twilio integrations with latency snapshots."
  }
];

export default function AdminSystemPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          System health
        </Title>
        <Text size="sm" c="dimmed">
          Track service-level indicators across database, authentication, background jobs, and third-party integrations.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {CHECKS.map((check) => (
          <Paper key={check.title} withBorder radius="lg" p="lg" variant="surfacePrimary">
            <Stack gap="sm">
              <Title order={4} size="h5">
                {check.title}
              </Title>
              <Text size="sm" c="dimmed">
                {check.description}
              </Text>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder radius="lg" p="lg" variant="surfaceSunken">
        <Stack gap="sm">
          <Title order={4} size="h5">
            Job queue status
          </Title>
          <Text size="sm" c="dimmed">
            This section will surface reminder jobs, failed syncs, and upcoming scheduled tasks once the admin API endpoints are
            wired up.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
