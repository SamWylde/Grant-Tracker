"use client";

import { Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

export default function StripeTesterPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Stripe integration checks
        </Title>
        <Text size="sm" c="dimmed">
          Placeholder interface for listing products, recent subscription events, and triggering webhook simulations. Connect
          the Stripe secret key in the admin API routes to enable live testing.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
          <Stack gap="sm">
            <Title order={4} size="h5">
              Product catalog
            </Title>
            <Text size="sm" c="dimmed">
              Upcoming feature to query `/v1/products` and `/v1/prices` using the Stripe SDK. Results will include product name,
              pricing mode, and currently active tiers.
            </Text>
          </Stack>
        </Paper>
        <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
          <Stack gap="sm">
            <Title order={4} size="h5">
              Webhook tester
            </Title>
            <Text size="sm" c="dimmed">
              Fire sample checkout, invoice, and subscription events. Admin actions will be logged to the audit log for tracking.
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
