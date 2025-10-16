"use client";

import { Badge, Card, Grid, Group, List, Paper, Stack, Text, Title } from "@mantine/core";

export default function StripeTesterPage() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Stripe integration tools</Title>
        <Text size="sm" c="dimmed">
          Validate Stripe configuration, inspect products, and simulate webhook payloads. The live API wiring will be layered on top of
          these scaffolds.
        </Text>
      </Stack>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="lg" padding="lg" h="100%">
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={4}>Product catalog</Title>
                <Badge color="midnight" variant="light">
                  Coming soon
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                The final experience will display products, prices, and subscription statuses pulled directly from Stripe. You&apos;ll be
                able to impersonate an organization and trigger plan changes.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="lg" padding="lg" h="100%">
            <Stack gap="sm">
              <Title order={4}>Webhook simulator</Title>
              <Text size="sm" c="dimmed">
                Fire test events (checkout.session.completed, invoice.payment_failed, customer.subscription.deleted) against the admin
                API to confirm downstream jobs are wired correctly.
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Paper withBorder radius="lg" p="lg" variant="surface">
        <Stack gap="sm">
          <Title order={5}>Planned checklist</Title>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>List products & prices, sorted by active status.</List.Item>
            <List.Item>Display subscription events from the last 30 days with filters.</List.Item>
            <List.Item>Manual webhook trigger with payload builder and retry logic.</List.Item>
          </List>
        </Stack>
      </Paper>
    </Stack>
  );
}
