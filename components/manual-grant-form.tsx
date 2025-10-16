"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  ActionIcon,
  Button,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { useGrantContext, type Priority, type Stage } from "./grant-context";

const STAGE_OPTIONS: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];
const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];

type TaskDraftState = {
  label: string;
  dueDate: string;
  assignee: string;
};

export function ManualGrantForm() {
  const { createManualGrant } = useGrantContext();
  const [title, setTitle] = useState("");
  const [agency, setAgency] = useState("");
  const [summary, setSummary] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [owner, setOwner] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [stage, setStage] = useState<Stage>("Researching");
  const [tasks, setTasks] = useState<TaskDraftState[]>([]);
  const [createdGrantId, setCreatedGrantId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const addEmptyTask = () => {
    setTasks((prev) => [...prev, { label: "", dueDate: "", assignee: "" }]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    if (!title.trim() || !agency.trim()) {
      setStatus("Title and agency are required.");
      return;
    }
    const id = createManualGrant({
      title: title.trim(),
      agency: agency.trim(),
      summary: summary.trim(),
      closeDate: closeDate ? new Date(closeDate).toISOString() : null,
      owner: owner.trim() || undefined,
      notes,
      priority,
      stage,
      tasks: tasks
        .filter((task) => task.label.trim())
        .map((task) => ({
          label: task.label.trim(),
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
          assigneeEmail: task.assignee.trim() || null,
          status: "pending"
        })),
      source: "manual"
    });
    setCreatedGrantId(id);
    setStatus("Grant added to your workspace.");
    setTitle("");
    setAgency("");
    setSummary("");
    setCloseDate("");
    setOwner("");
    setNotes("");
    setPriority("Medium");
    setStage("Researching");
    setTasks([]);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      withBorder
      radius="xl"
      p="xl"
      variant="surfacePrimary"
    >
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={2}>Log a manual opportunity</Title>
          <Text size="sm" c="dimmed">
            Capture prospects that aren&apos;t published on Grants.gov. They&apos;ll appear alongside your pipeline with full reminders and tasks.
          </Text>
        </Stack>
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Grant title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
              placeholder="Local foundation opportunity"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Funding agency"
              value={agency}
              onChange={(event) => setAgency(event.currentTarget.value)}
              required
              placeholder="Community Foundation"
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Summary"
              value={summary}
              onChange={(event) => setSummary(event.currentTarget.value)}
              placeholder="Key fit notes or requirements"
              minRows={3}
              autosize
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Primary due date"
              type="date"
              value={closeDate}
              onChange={(event) => setCloseDate(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Pipeline owner email"
              type="email"
              value={owner}
              onChange={(event) => setOwner(event.currentTarget.value)}
              placeholder="teammate@nonprofit.org"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Stage"
              data={STAGE_OPTIONS.map((option) => ({ value: option, label: option }))}
              value={stage}
              onChange={(value) => setStage((value as Stage) ?? stage)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Priority"
              data={PRIORITY_OPTIONS.map((option) => ({ value: option, label: option }))}
              value={priority}
              onChange={(value) => setPriority((value as Priority) ?? priority)}
            />
          </Grid.Col>
        </Grid>
        <Textarea
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          placeholder="Submission approach, contacts, or history"
          autosize
          minRows={3}
        />
        <Paper withBorder radius="lg" p="lg" variant="surfaceIndigo">
          <Stack gap="md">
            <Stack gap={4}>
              <Text fw={600}>Checklist tasks</Text>
              <Text size="xs" c="dimmed">
                Break the work down and assign it immediately. Leave blank if you&apos;ll create tasks later.
              </Text>
            </Stack>
            {tasks.length === 0 && (
              <Text size="xs" c="dimmed">
                No tasks yet. Add your first item below.
              </Text>
            )}
            <Stack gap="sm">
              {tasks.map((task, index) => (
                <Paper key={`task-${index}`} withBorder radius="md" p="md" variant="surfaceSunken">
                  <Grid gutter="md" align="center">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Task label"
                        value={task.label}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setTasks((prev) => prev.map((item, taskIndex) => (taskIndex === index ? { ...item, label: value } : item)));
                        }}
                        placeholder="Draft narrative"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 3 }}>
                      <TextInput
                        label="Due date"
                        type="date"
                        value={task.dueDate}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setTasks((prev) => prev.map((item, taskIndex) => (taskIndex === index ? { ...item, dueDate: value } : item)));
                        }}
                      />
                    </Grid.Col>
                  <Grid.Col span={{ base: 11, sm: 3 }}>
                    <TextInput
                      label="Assignee email"
                      type="email"
                      value={task.assignee}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setTasks((prev) => prev.map((item, taskIndex) => (taskIndex === index ? { ...item, assignee: value } : item)));
                      }}
                      placeholder="owner@nonprofit.org"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 1 }}>
                    <Group justify="flex-end">
                      <ActionIcon
                        color="red"
                        variant="light"
                        aria-label="Remove task"
                        onClick={() => setTasks((prev) => prev.filter((_, taskIndex) => taskIndex !== index))}
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Paper>
            ))}
          </Stack>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconPlus size="1rem" />}
              onClick={addEmptyTask}
            >
              Add task
            </Button>
          </Stack>
        </Paper>
        <Group justify="space-between" align="center">
          <Button type="submit">Save grant</Button>
          <Stack gap={2} align="flex-end" miw={180}>
            {status && (
              <Text size="xs" c="dimmed">
                {status}
              </Text>
            )}
            {createdGrantId && (
              <Text size="xs">
                <Link href={`/grants/${encodeURIComponent(createdGrantId)}`}>View grant details</Link>
              </Text>
            )}
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}
