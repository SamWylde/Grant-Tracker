"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  Anchor,
  Badge,
  Button,
  Checkbox,
  Container,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title
} from "@mantine/core";

import { useAuth } from "@/components/auth-context";
import { useGrantContext } from "@/components/grant-context";

function formatDisplayDate(date: string | null, timezone: string) {
  if (!date) return "No due date";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(date));
  } catch (error) {
    console.error("Failed to format date", error);
    return date;
  }
}

export default function MyTasksPage() {
  const { user, isLoading } = useAuth();
  const { savedGrants, toggleTaskStatus, orgPreferences } = useGrantContext();
  const timezone = orgPreferences.timezone ?? "UTC";

  const assignments = useMemo(() => {
    const entries = [] as Array<{
      grantId: string;
      grantTitle: string;
      stage: string;
      taskId: string;
      label: string;
      dueDate: string | null;
      status: string;
    }>;
    if (!user) return entries;
    for (const [grantId, grant] of Object.entries(savedGrants)) {
      for (const task of grant.tasks ?? []) {
        const matchesAssignee =
          task.assigneeId === user.id || task.assigneeEmail?.toLowerCase() === user.email?.toLowerCase();
        if (!matchesAssignee) continue;
        entries.push({
          grantId,
          grantTitle: grant.title,
          stage: grant.stage,
          taskId: task.id,
          label: task.label,
          dueDate: task.dueDate ?? null,
          status: task.status
        });
      }
    }
    return entries.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return a.grantTitle.localeCompare(b.grantTitle);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [savedGrants, user]);

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Text size="sm" c="dimmed" ta="center">
          Loading your tasks…
        </Text>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="sm" ta="center">
          <Title order={3}>Sign in to view “My Tasks”</Title>
          <Text size="sm" c="dimmed">
            Authenticate with your Supabase account so we can personalize task assignments for you.
          </Text>
          <Button component={Link} href="/" variant="outline" radius="xl">
            Return home
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>My upcoming tasks</Title>
          <Text size="sm" c="dimmed">
            Stay ahead of due dates across every grant you&apos;re supporting. Check items off as you complete them.
          </Text>
        </Stack>
        <Paper withBorder radius="xl" variant="surfacePrimary">
          <ScrollArea>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Grant</Table.Th>
                  <Table.Th>Task</Table.Th>
                  <Table.Th>Due</Table.Th>
                  <Table.Th>Stage</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {assignments.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed" ta="center">
                        No tasks assigned to you yet. Once teammates add you to a checklist item, it will appear here.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  assignments.map((task) => (
                    <Table.Tr key={task.taskId}>
                      <Table.Td>
                        <Anchor component={Link} href={`/grants/${encodeURIComponent(task.grantId)}`}>
                          {task.grantTitle}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{task.label}</Table.Td>
                      <Table.Td>{formatDisplayDate(task.dueDate, timezone)}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="midnight">
                          {task.stage}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="sm">
                          <Checkbox
                            checked={task.status === "completed"}
                            onChange={(event) => toggleTaskStatus(task.grantId, task.taskId, event.currentTarget.checked)}
                          />
                          <Text size="xs" c={task.status === "completed" ? "teal.3" : "dimmed"}>
                            {task.status === "completed" ? "Completed" : "Pending"}
                          </Text>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      </Stack>
    </Container>
  );
}
