"use client";

import { useState } from "react";

import { Badge, Button, Card, Group, Paper, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { IconSearch, IconUserShield } from "@tabler/icons-react";

const mockUsers = [
  {
    id: "user-1",
    email: "casey@example.org",
    name: "Casey Hart",
    lastLogin: "2024-05-28",
    org: "River Valley Coalition",
    role: "admin"
  },
  {
    id: "user-2",
    email: "alex@ruralhealth.org",
    name: "Alex Johnson",
    lastLogin: "2024-05-27",
    org: "Rural Health Initiative",
    role: "contributor"
  }
];

export default function UserManagementPage() {
  const [search, setSearch] = useState("");

  const filteredUsers = mockUsers.filter((user) =>
    [user.email, user.name, user.org].some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>User management</Title>
        <Text size="sm" c="dimmed">
          Search accounts, review organization memberships, and promote platform administrators. Real data will be loaded from the admin
          API and Supabase auth tables.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <TextInput
            placeholder="Search by email, name, or organization"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Organization</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Last login</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>{user.email}</Table.Td>
                  <Table.Td>{user.name}</Table.Td>
                  <Table.Td>{user.org}</Table.Td>
                  <Table.Td>
                    <Badge color={user.role === "admin" ? "teal" : "gray"} variant="light">
                      {user.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{user.lastLogin}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="light" color="midnight" leftSection={<IconUserShield size={14} />} disabled>
                        Promote
                      </Button>
                      <Button size="xs" variant="subtle" color="red" disabled>
                        Disable
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      <Paper withBorder radius="lg" p="lg" variant="surface">
        <Stack gap={4}>
          <Title order={5}>Notes</Title>
          <Text size="sm" c="dimmed">
            Platform admins should enable multi-factor authentication and regularly review audit logs. Invitations and password resets will
            be triggered via Supabase auth.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
