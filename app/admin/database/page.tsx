"use client";

import { Anchor, Badge, Card, Group, List, ScrollArea, Stack, Table, Text, Title } from "@mantine/core";

const placeholderTables = [
  {
    name: "orgs",
    rows: "~120",
    description: "Top-level organization metadata including timezone and subscription tier."
  },
  {
    name: "grants",
    rows: "~4.2k",
    description: "Grant opportunities tracked in the platform. Includes integration IDs and stage metadata."
  },
  {
    name: "org_memberships",
    rows: "~800",
    description: "Member roster linking Supabase auth users to organizations with role and status information."
  }
];

export default function DatabaseBrowserPage() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Database browser</Title>
        <Text size="sm" c="dimmed">
          Explore schema metadata, inspect rows, and review relational constraints. Live querying hooks into the SQL workbench—this page
          surfaces quick insights and saved explorations.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>Schema overview</Title>
          <ScrollArea h={240} type="auto">
            <Table highlightOnHover stickyHeader horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Rows</Table.Th>
                  <Table.Th>Description</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {placeholderTables.map((table) => (
                  <Table.Tr key={table.name}>
                    <Table.Td>
                      <Text fw={600}>{table.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="midnight" variant="light">
                        {table.rows}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {table.description}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>Coming soon</Title>
          <Text size="sm" c="dimmed">
            The interactive browser will support table search, inline filtering, editing for platform admins, and quick actions such as
            viewing RLS configuration. Track progress in the project roadmap.
          </Text>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>Table filters with per-column controls and saved views.</List.Item>
            <List.Item>Migration insights sourced from the Supabase migration history.</List.Item>
            <List.Item>Visual relationship map showing foreign key dependencies.</List.Item>
          </List>
          <Group>
            <Anchor href="/admin/docs">Read the admin docs</Anchor>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
