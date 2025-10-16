"use client";

import { Badge, Card, Group, ScrollArea, Stack, Table, Text, Title } from "@mantine/core";

const mockAuditEntries = [
  {
    id: "log-1",
    action: "sql_query_executed",
    actor: "casey@example.org",
    timestamp: "2024-05-30T12:04:11Z",
    summary: "SELECT * FROM orgs LIMIT 5"
  },
  {
    id: "log-2",
    action: "admin_access_denied",
    actor: "alex@ruralhealth.org",
    timestamp: "2024-05-29T21:13:44Z",
    summary: "Attempted to access /admin/sql"
  }
];

export default function AuditLogPage() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Audit logs</Title>
        <Text size="sm" c="dimmed">
          Every admin panel action is written to the admin_audit_log table. Once wired to Supabase, this feed will update in near-real
          time and expose filtering by actor, action type, and date range.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <Title order={4}>Recent events</Title>
            <Badge color="midnight" variant="light">
              {mockAuditEntries.length}
            </Badge>
          </Group>
          <ScrollArea h={300} type="auto">
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Actor</Table.Th>
                  <Table.Th>Action</Table.Th>
                  <Table.Th>Summary</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mockAuditEntries.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{new Date(entry.timestamp).toLocaleString()}</Table.Td>
                    <Table.Td>{entry.actor}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="midnight">
                        {entry.action}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {entry.summary}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>
    </Stack>
  );
}
