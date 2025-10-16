"use client";

import { Paper, Stack, Table, Text, Title } from "@mantine/core";

const PLACEHOLDER_ROWS = [
  {
    name: "Community Uplift",
    members: 14,
    grants: 28,
    tier: "Pro",
    lastActivity: "2024-06-30"
  },
  {
    name: "Rural Growth Coalition",
    members: 6,
    grants: 12,
    tier: "Starter",
    lastActivity: "2024-06-27"
  }
];

export default function AdminOrganizationsPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Organization directory
        </Title>
        <Text size="sm" c="dimmed">
          View high-level metrics across every organization in the platform. Future iterations will allow impersonation, ICS
          resets, and subscription management directly from this screen.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Organization</Table.Th>
              <Table.Th>Members</Table.Th>
              <Table.Th>Grants saved</Table.Th>
              <Table.Th>Tier</Table.Th>
              <Table.Th>Last activity</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {PLACEHOLDER_ROWS.map((row) => (
              <Table.Tr key={row.name}>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>{row.members}</Table.Td>
                <Table.Td>{row.grants}</Table.Td>
                <Table.Td>{row.tier}</Table.Td>
                <Table.Td>{row.lastActivity}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed" mt="md">
          Data previewed for layout purposes. Wire up `/api/admin/orgs` to hydrate this table with live metrics and enable
          row-level actions.
        </Text>
      </Paper>
    </Stack>
  );
}
