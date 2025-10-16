"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  Anchor,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";

import { describeOffset, formatReminderDate } from "@/lib/reminders";

import {
  useGrantContext,
  type Milestone,
  type Priority,
  type Stage
} from "./grant-context";
import { TaskChecklist } from "./task-checklist";

const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
const STAGE_OPTIONS: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];

export function GrantDetailView({ grantId }: { grantId: string }) {
  const router = useRouter();
  const {
    savedGrants,
    updateGrantDetails,
    updateGrantStage,
    updateMilestone,
    addMilestone,
    removeMilestone,
    orgPreferences
  } = useGrantContext();

  const grant = savedGrants[grantId];

  const [newAttachment, setNewAttachment] = useState("");
  const [newMilestoneLabel, setNewMilestoneLabel] = useState("");

  const history = useMemo(() => grant?.history.slice().reverse() ?? [], [grant?.history]);
  const milestones = useMemo(() => {
    const items = grant?.milestones ?? [];
    return items
      .slice()
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return a.label.localeCompare(b.label);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [grant?.milestones]);
  const timezone = orgPreferences.timezone ?? "UTC";

  if (!grant) {
    return (
      <Stack align="center" justify="center" gap="md" py="xl">
        <Title order={2}>We couldn&apos;t find that grant.</Title>
        <Text size="sm" c="dimmed" maw={360} ta="center">
          Save an opportunity from the discovery workspace first, then open it here to manage details.
        </Text>
        <Button variant="outline" onClick={() => router.push("/#workspace")}
        >
          Go back to workspace
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" py="xl" maw={1100} mx="auto">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {grant.agency}
          </Text>
          <Title order={1}>{grant.title}</Title>
          <Text size="sm" c="dimmed" maw={720}>
            {grant.summary}
          </Text>
        </Stack>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </Group>
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="lg">
            <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
              <Stack gap="md">
                <Title order={3}>Pipeline settings</Title>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <SelectField label="Stage">
                      <SegmentedControl
                        fullWidth
                        data={STAGE_OPTIONS.map((stage) => ({ label: stage, value: stage }))}
                        value={grant.stage}
                        onChange={(value) => updateGrantStage(grantId, value as Stage)}
                      />
                    </SelectField>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <SelectField label="Owner">
                      <TextInput
                        value={grant.owner ?? ""}
                        onChange={(event) => updateGrantDetails(grantId, { owner: event.currentTarget.value })}
                        placeholder="Assign a teammate"
                      />
                    </SelectField>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <SelectField label="Priority">
                      <SegmentedControl
                        fullWidth
                        data={PRIORITY_OPTIONS.map((priority) => ({ label: priority, value: priority }))}
                        value={grant.priority}
                        onChange={(value) => updateGrantDetails(grantId, { priority: value as Priority })}
                      />
                    </SelectField>
                  </Grid.Col>
                </Grid>
                <SelectField label="Notes">
                  <Textarea
                    value={grant.notes ?? ""}
                    onChange={(event) => updateGrantDetails(grantId, { notes: event.currentTarget.value })}
                    placeholder="Capture strategy, required attachments, or reminders"
                    autosize
                    minRows={4}
                  />
                </SelectField>
              </Stack>
            </Paper>

            <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
              <Stack gap="md">
                <Title order={3}>Deadline management & reminders</Title>
                <Text size="sm" c="dimmed">
                  Track LOI, application, report, and custom milestones. Set due dates once and Grant Tracker will schedule reminders at T-30/14/7/3/1 and day-of across email and SMS without duplicating alerts.
                </Text>
                <Stack gap="md">
                  {milestones.map((milestone) => (
                    <MilestoneEditor
                      key={milestone.id}
                      milestone={milestone}
                      timezone={timezone}
                      onUpdate={(updates) => updateMilestone(grantId, milestone.id, updates)}
                      onRemove={() => removeMilestone(grantId, milestone.id)}
                      isCustom={milestone.type === "Custom"}
                      defaultChannels={orgPreferences.reminderChannels}
                      grantTitle={grant.title}
                    />
                  ))}
                </Stack>
                <Paper
                  component="form"
                  withBorder
                  radius="lg"
                  p="md"
                  bg="rgba(6,14,32,0.6)"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const trimmed = newMilestoneLabel.trim();
                    if (!trimmed) return;
                    addMilestone(grantId, { label: trimmed, type: "Custom" });
                    setNewMilestoneLabel("");
                  }}
                >
                  <Stack gap="sm">
                    <Text size="xs" fw={600} tt="uppercase">
                      Add custom milestone
                    </Text>
                    <Group gap="sm" wrap="wrap">
                      <TextInput
                        style={{ flex: 1, minWidth: 220 }}
                        value={newMilestoneLabel}
                        onChange={(event) => setNewMilestoneLabel(event.currentTarget.value)}
                        placeholder="Site visit, board review, etc."
                      />
                      <Button type="submit" size="sm">
                        Add milestone
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>

            <TaskChecklist grantId={grantId} />

            <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
              <Stack gap="md">
                <Title order={3}>Attachments & links</Title>
                <Text size="sm" c="dimmed">
                  Store URLs for working documents, budgets, or support letters so the whole team can find them quickly.
                </Text>
                <Group
                  component="form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const trimmed = newAttachment.trim();
                    if (!trimmed) return;
                    const existing = grant.attachments ?? [];
                    updateGrantDetails(grantId, {
                      attachments: Array.from(new Set([...existing, trimmed]))
                    });
                    setNewAttachment("");
                  }}
                  gap="sm"
                  wrap="wrap"
                >
                  <TextInput
                    style={{ flex: 1, minWidth: 240 }}
                    value={newAttachment}
                    onChange={(event) => setNewAttachment(event.currentTarget.value)}
                    placeholder="https://"
                  />
                  <Button type="submit" size="sm">
                    Add link
                  </Button>
                </Group>
                <Stack gap="sm">
                  {(grant.attachments ?? []).map((attachment) => (
                    <Group
                      key={attachment}
                      justify="space-between"
                      align="center"
                      px="sm"
                      py="xs"
                      bg="rgba(6,14,32,0.6)"
                      style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <Anchor href={attachment} target="_blank" rel="noreferrer" size="sm">
                        {attachment}
                      </Anchor>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => {
                          const filtered = (grant.attachments ?? []).filter((item) => item !== attachment);
                          updateGrantDetails(grantId, { attachments: filtered });
                        }}
                      >
                        Remove
                      </Button>
                    </Group>
                  ))}
                  {(grant.attachments?.length ?? 0) === 0 && (
                    <Text size="xs" c="dimmed">
                      No attachments saved yet.
                    </Text>
                  )}
                </Stack>
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="lg">
            <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
              <Title order={4}>Key facts</Title>
              <Stack gap="sm" mt="sm">
                <Fact label="Opportunity #" value={grant.opportunityNumber} />
                <Fact
                  label="Due date"
                  value={grant.closeDate ? new Date(grant.closeDate).toLocaleDateString() : "Rolling"}
                />
                <Fact
                  label="Award ceiling"
                  value={
                    grant.awardCeiling
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0
                        }).format(grant.awardCeiling)
                      : "Not specified"
                  }
                />
                <Fact label="Focus areas" value={grant.focusAreas.join(", ") || "General"} />
              </Stack>
              <Button
                component="a"
                href={grant.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                variant="outline"
                mt="md"
              >
                View opportunity on Grants.gov
              </Button>
            </Paper>
            <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
              <Title order={4}>Stage history</Title>
              <Stack gap="sm" mt="sm">
                {history.length === 0 && (
                  <Text size="xs" c="dimmed">
                    No movements recorded yet.
                  </Text>
                )}
                {history.map((entry, index) => (
                  <Card key={`${entry.stage}-${index}`} withBorder radius="md" bg="rgba(6,14,32,0.6)" padding="md">
                    <Stack gap={4}>
                      <Badge size="xs" variant="light" color="midnight">
                        {entry.stage}
                      </Badge>
                      <Text size="sm" fw={500}>
                        {new Date(entry.changedAt).toLocaleString()}
                      </Text>
                      {entry.note && (
                        <Text size="xs" c="dimmed">
                          {entry.note}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

type MilestoneEditorProps = {
  milestone: Milestone;
  timezone: string;
  onUpdate: (updates: Partial<Milestone>) => void;
  onRemove: () => void;
  isCustom: boolean;
  defaultChannels: Milestone["reminderChannels"];
  grantTitle: string;
};

function MilestoneEditor({
  milestone,
  timezone,
  onUpdate,
  onRemove,
  isCustom,
  defaultChannels,
  grantTitle
}: MilestoneEditorProps) {
  const channelOptions: Milestone["reminderChannels"] = ["email", "sms"];
  return (
    <Paper withBorder radius="lg" p="lg" bg="rgba(6,14,32,0.6)">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            {isCustom ? (
              <TextInput
                value={milestone.label}
                onChange={(event) => onUpdate({ label: event.currentTarget.value })}
                label="Milestone name"
              />
            ) : (
              <Stack gap={2}>
                <Text fw={600}>{milestone.label}</Text>
                <Text size="xs" c="dimmed" tt="uppercase">
                  {milestone.type === "Custom" ? "Custom milestone" : milestone.type}
                </Text>
              </Stack>
            )}
          </Stack>
          {isCustom && (
            <Button variant="subtle" color="red" size="xs" onClick={onRemove}>
              Remove
            </Button>
          )}
        </Group>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Due date"
              type="date"
              value={milestone.dueDate ?? ""}
              onChange={(event) => onUpdate({ dueDate: event.currentTarget.value || null })}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Group justify="space-between" align="center" p="md" bg="rgba(2,10,28,0.7)" style={{ borderRadius: 12 }}>
              <Stack gap={2}>
                <Text size="xs" fw={600} tt="uppercase">
                  Reminders
                </Text>
                <Text size="xs" c="dimmed">
                  Email & SMS at T-30/14/7/3/1/day-of.
                </Text>
              </Stack>
              <Switch
                checked={milestone.remindersEnabled}
                onChange={(event) =>
                  onUpdate({
                    remindersEnabled: event.currentTarget.checked,
                    reminderChannels:
                      milestone.reminderChannels.length > 0
                        ? milestone.reminderChannels
                        : defaultChannels.length > 0
                        ? defaultChannels
                        : (["email"] as Milestone["reminderChannels"])
                  })
                }
              />
            </Group>
          </Grid.Col>
        </Grid>
        <Group gap="xs" wrap="wrap">
          {channelOptions.map((channel) => {
            const active = milestone.reminderChannels.includes(channel);
            return (
              <Badge
                key={channel}
                color={active ? "teal" : "gray"}
                variant={active ? "filled" : "outline"}
                radius="xl"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (!milestone.remindersEnabled) {
                    onUpdate({ remindersEnabled: true });
                  }
                  const next = active
                    ? milestone.reminderChannels.filter((item) => item !== channel)
                    : [...milestone.reminderChannels, channel];
                  onUpdate({ reminderChannels: next.length > 0 ? next : [channel] });
                }}
              >
                {channel.toUpperCase()}
              </Badge>
            );
          })}
        </Group>
        <Stack gap="xs">
          <Text size="xs" fw={600}>
            Scheduled notifications
          </Text>
          {milestone.remindersEnabled && milestone.scheduledReminders.length > 0 ? (
            <Stack gap="xs">
              {milestone.scheduledReminders.map((reminder) => (
                <Paper
                  key={`${milestone.id}-${reminder.channel}-${reminder.offsetDays}`}
                  withBorder
                  radius="md"
                  p="sm"
                  bg="rgba(2,10,28,0.8)"
                >
                  <Group justify="space-between" align="center">
                    <Text size="xs" fw={600}>
                      {reminder.channel === "email" ? "Email" : "SMS"} · {describeOffset(reminder.offsetDays)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatReminderDate(reminder.sendAt, timezone)} ({timezone})
                    </Text>
                  </Group>
                  {reminder.subject && (
                    <Text size="xs" c="dimmed" mt={4}>
                      <strong>Subject:</strong> {reminder.subject}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed" mt={4}>
                    {reminder.preview}…
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    Template respects {grantTitle} timezone ({timezone}) and unsubscribe flow.
                  </Text>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Paper withBorder radius="md" p="md" bg="rgba(2,10,28,0.7)">
              <Text size="xs" c="dimmed">
                {milestone.dueDate
                  ? "Enable reminders to automatically queue notifications."
                  : "Add a due date to generate reminders."}
              </Text>
            </Paper>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

type SelectFieldProps = {
  label: string;
  children: React.ReactNode;
};

function SelectField({ label, children }: SelectFieldProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

type FactProps = {
  label: string;
  value: string;
};

function Fact({ label, value }: FactProps) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </Stack>
  );
}
