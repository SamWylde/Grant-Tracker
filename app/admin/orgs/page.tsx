"use client";

import { Badge, Button, Card, Grid, Group, Paper, Progress, Stack, Table, Text, Title } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";

const mockOrganizations = [
  {
    id: "org-1",
    name: "River Valley Coalition",
    members: 14,
    grants: 38,
    tier: "Pro",
    activeGrants: 7,
    storage: 62
  },
  {
    id: "org-2",
    name: "Rural Health Initiative",
    members: 9,
    grants: 21,
    tier: "Starter",
    activeGrants: 4,
    storage: 18
  }
];

export default function OrganizationManagementPage() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Organization management</Title>
        <Text size="sm" c="dimmed">
          Review accounts, impersonate admins for support, and monitor usage signals. Data below is mocked until the admin API endpoints
          are connected.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>Organizations</Title>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Grants</Table.Th>
                <Table.Th>Tier</Table.Th>
                <Table.Th>Active grants</Table.Th>
                <Table.Th>Storage usage</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {mockOrganizations.map((org) => (
                <Table.Tr key={org.id}>
                  <Table.Td>
                    <Text fw={600}>{org.name}</Text>
                  </Table.Td>
                  <Table.Td>{org.members}</Table.Td>
                  <Table.Td>{org.grants}</Table.Td>
                  <Table.Td>
                    <Badge color="midnight" variant="light">
                      {org.tier}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{org.activeGrants}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Progress value={org.storage} color="midnight" w={120} />
                      <Text size="xs" c="dimmed">
                        {org.storage}%
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="light" leftSection={<IconEye size={14} />} disabled>
                      View
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      <Paper withBorder radius="lg" p="lg" variant="surface">
        <Stack gap={4}>
          <Title order={5}>Roadmap</Title>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="md" padding="md">
                <Text size="sm" fw={600}>
                  Impersonation controls
                </Text>
                <Text size="xs" c="dimmed">
                  Trigger support-mode sessions scoped to an organization with explicit logging and expiration timers.
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="md" padding="md">
                <Text size="sm" fw={600}>
                  ICS secret rotation
                </Text>
                <Text size="xs" c="dimmed">
                  Allow admins to rotate calendar secrets and invalidate prior feed URLs.
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
}
