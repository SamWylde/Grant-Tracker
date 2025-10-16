"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";

import { useAuth } from "./auth-context";
import { useGrantContext } from "./grant-context";

function formatDateInput(date: string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

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

export function TaskChecklist({ grantId }: { grantId: string }) {
  const { user } = useAuth();
  const {
    savedGrants,
    addTask,
    updateTask,
    toggleTaskStatus,
    removeTask,
    orgPreferences
  } = useGrantContext();
  const grant = savedGrants[grantId];
  const timezone = orgPreferences.timezone ?? "UTC";

  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [assignee, setAssignee] = useState<string>(user?.email ?? "");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const items = grant?.tasks ?? [];
    return items
      .slice()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.label.localeCompare(b.label);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [grant?.tasks]);

  if (!grant) {
    return null;
  }

  function resetForm() {
    setLabel("");
    setDueDate("");
    setAssignee(user?.email ?? "");
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    const trimmed = label.trim();
    if (!trimmed) {
      setStatusMessage("Add a task description.");
      return;
    }
    addTask(grantId, {
      label: trimmed,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeEmail: assignee || null,
      assigneeId: assignee && assignee === user?.email ? user?.id : null,
      assigneeName: assignee && assignee === user?.email ? user?.fullName ?? null : null,
      createdByEmail: user?.email ?? null,
      createdById: user?.id ?? null,
      createdByName: user?.fullName ?? null,
      status: "pending"
    });
    resetForm();
    setStatusMessage("Task added to checklist.");
  }

  return (
    <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>Task checklist</Title>
          <Text size="sm" c="dimmed">
            Assign workstreams with due dates so every collaborator knows what to tackle next.
          </Text>
        </Stack>
        <Paper
          component="form"
          withBorder
          radius="lg"
          p="md"
          bg="rgba(6,14,32,0.6)"
          onSubmit={handleAddTask}
        >
          <Stack gap="sm">
            <Group gap="sm" grow>
              <TextInput
                label="Task"
                value={label}
                onChange={(event) => setLabel(event.currentTarget.value)}
                placeholder="Draft narrative, gather letters of support, etc."
              />
              <TextInput
                label="Due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.currentTarget.value)}
              />
              <TextInput
                label="Assignee"
                type="email"
                value={assignee}
                onChange={(event) => setAssignee(event.currentTarget.value)}
                placeholder="owner@nonprofit.org"
              />
            </Group>
            <Group justify="space-between" align="center">
              <Button type="submit" size="sm">
                Add task
              </Button>
              {statusMessage && (
                <Text size="xs" c="dimmed">
                  {statusMessage}
                </Text>
              )}
            </Group>
          </Stack>
        </Paper>
        <Stack gap="sm">
          {tasks.length === 0 ? (
            <Text size="sm" c="dimmed">
              No tasks yet. Add your first checklist item above.
            </Text>
          ) : (
            tasks.map((task) => (
              <Paper key={task.id} withBorder radius="lg" p="md" bg="rgba(6,14,32,0.6)">
                <Stack gap="sm">
                  <Group align="flex-start" gap="md">
                    <Checkbox
                      checked={task.status === "completed"}
                      onChange={(event) => toggleTaskStatus(grantId, task.id, event.currentTarget.checked)}
                      mt={4}
                    />
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text fw={600} c={task.status === "completed" ? "dimmed" : undefined} style={task.status === "completed" ? { textDecoration: "line-through" } : undefined}>
                        {task.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDisplayDate(task.dueDate, timezone)} • {task.assigneeEmail ? `Assigned to ${task.assigneeEmail}` : "Unassigned"}
                      </Text>
                    </Stack>
                  </Group>
                  <Group gap="sm" wrap="wrap">
                    <TextInput
                      label="Due"
                      type="date"
                      value={formatDateInput(task.dueDate)}
                      onChange={(event) =>
                        updateTask(grantId, task.id, {
                          dueDate: event.currentTarget.value ? new Date(event.currentTarget.value).toISOString() : null
                        })
                      }
                      size="xs"
                      w={160}
                    />
                    <TextInput
                      label="Assignee"
                      type="email"
                      value={task.assigneeEmail ?? ""}
                      onChange={(event) =>
                        updateTask(grantId, task.id, {
                          assigneeEmail: event.currentTarget.value || null
                        })
                      }
                      size="xs"
                      w={200}
                    />
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => removeTask(grantId, task.id)}
                    >
                      Remove
                    </Button>
                    <Badge size="xs" variant="light" color={task.status === "completed" ? "teal" : "gray"}>
                      {task.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
