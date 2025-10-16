"use client";

import { Paper, Stack, Table, Text, TextInput, Title } from "@mantine/core";

export default function AdminUsersPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          User management
        </Title>
        <Text size="sm" c="dimmed">
          Search across all Supabase auth users, view organization memberships, and trigger account actions such as password
          resets or platform admin promotions.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
        <Stack gap="md">
          <TextInput label="Search email" placeholder="user@example.org" />
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Organizations</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Last login</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed" ta="center">
                    Connect the `/api/admin/users` endpoint to populate this table with live data.
                  </Text>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>
    </Stack>
  );
}
