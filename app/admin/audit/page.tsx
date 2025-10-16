"use client";

import { Paper, Stack, Table, Text, Title } from "@mantine/core";

export default function AdminAuditPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Audit log
        </Title>
        <Text size="sm" c="dimmed">
          All admin interactions are recorded to the `admin_audit_log` table, including SQL execution, impersonation, and
          destructive actions. Use this view to filter by admin, timeframe, or action type.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Timestamp</Table.Th>
              <Table.Th>Admin</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Details</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text size="sm" c="dimmed" ta="center">
                  Hook up `/api/admin/audit` to populate this log with live data.
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
