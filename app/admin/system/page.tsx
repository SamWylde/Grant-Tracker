"use client";

import { Badge, Card, Grid, Group, Progress, Stack, Table, Text, Title } from "@mantine/core";
import { IconHeartbeat, IconServer } from "@tabler/icons-react";

const mockChecks = [
  { name: "Database", status: "Healthy", latencyMs: 38 },
  { name: "Supabase Auth", status: "Healthy", latencyMs: 52 },
  { name: "Grants.gov API", status: "Warning", latencyMs: 310 },
  { name: "Stripe", status: "Unknown", latencyMs: null }
];

export default function SystemHealthPage() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>System health</Title>
        <Text size="sm" c="dimmed">
          Track core service availability, background job execution, and performance metrics. Data shown below is mocked while the admin
          observability endpoints are developed.
        </Text>
      </Stack>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="lg" padding="lg" h="100%">
            <Stack gap="sm">
              <Group>
                <IconHeartbeat size={20} />
                <Title order={4}>Health checks</Title>
              </Group>
              <Table verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Latency</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {mockChecks.map((check) => (
                    <Table.Tr key={check.name}>
                      <Table.Td>{check.name}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={check.status === "Healthy" ? "teal" : check.status === "Warning" ? "yellow" : "gray"}
                          variant="light"
                        >
                          {check.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {check.latencyMs != null ? `${check.latencyMs} ms` : <Text size="xs" c="dimmed">Pending</Text>}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="lg" padding="lg" h="100%">
            <Stack gap="sm">
              <Group>
                <IconServer size={20} />
                <Title order={4}>Job throughput</Title>
              </Group>
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Reminder jobs
                </Text>
                <Progress value={72} color="midnight" />
                <Text size="xs" c="dimmed">
                  72% of reminder jobs completed in the last 24 hours.
                </Text>
                <Text size="sm" fw={600}>
                  Data sync
                </Text>
                <Progress value={45} color="yellow" />
                <Text size="xs" c="dimmed">
                  Grants.gov sync is experiencing elevated latency; monitor logs for failures.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
