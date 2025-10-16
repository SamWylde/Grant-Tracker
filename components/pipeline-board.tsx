"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Anchor,
  Badge,
  Card,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title
} from "@mantine/core";

import { describeOffset, formatReminderDate } from "@/lib/reminders";

import { useGrantContext, type SavedGrant, type Stage } from "./grant-context";

const STAGES: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];

const PRIORITY_COLORS: Record<string, string> = {
  High: "red",
  Medium: "yellow",
  Low: "teal"
};

export function PipelineBoard() {
  const { savedGrants, updateGrantStage, orgPreferences } = useGrantContext();
  const [noteByGrant, setNoteByGrant] = useState<Record<string, string>>({});
  const timezone = orgPreferences.timezone ?? "UTC";

  const grantsByStage = useMemo(() => {
    const grouped: Record<Stage, SavedGrant[]> = {
      Researching: [],
      Drafting: [],
      Submitted: [],
      Awarded: [],
      Declined: []
    };

    for (const grant of Object.values(savedGrants)) {
      grouped[grant.stage]?.push(grant);
    }

    for (const stage of STAGES) {
      grouped[stage].sort((a, b) => {
        const dueA = a.closeDate ? new Date(a.closeDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dueB = b.closeDate ? new Date(b.closeDate).getTime() : Number.MAX_SAFE_INTEGER;
        return dueA - dueB;
      });
    }

    return grouped;
  }, [savedGrants]);

  if (Object.keys(savedGrants).length === 0) {
    return (
      <Paper withBorder radius="xl" p="xl" variant="surfacePrimary" ta="center">
        <Text size="sm" c="dimmed">
          Save a grant from the discovery list to start tracking it in your pipeline.
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="xl" p="xl" variant="surfacePrimary">
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>Pipeline board</Title>
          <Text size="sm" c="dimmed">
            Drag-free column updates: change the stage from the dropdown and we will log the move instantly.
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, md: 2, xl: 5 }} spacing="lg">
          {STAGES.map((stage) => {
            const grants = grantsByStage[stage] ?? [];
            return (
              <Card key={stage} withBorder radius="lg" p="lg" variant="surfaceBoard">
                <Group justify="space-between" align="center">
                  <Text size="sm" fw={600} tt="uppercase" c="dimmed">
                    {stage}
                  </Text>
                  <Badge variant="light" color="midnight">
                    {grants.length}
                  </Badge>
                </Group>
                <Stack gap="md" mt="md">
                  {grants.length === 0 && (
                    <Paper withBorder radius="md" p="md" variant="surfaceSunken">
                      <Text size="xs" c="dimmed">
                        No grants here yet.
                      </Text>
                    </Paper>
                  )}
                  {grants.map((grant) => {
                    const sortedMilestones = (grant.milestones ?? []).slice().sort((a, b) => {
                      if (!a.dueDate && !b.dueDate) return 0;
                      if (!a.dueDate) return 1;
                      if (!b.dueDate) return -1;
                      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    });
                    const nextMilestone = sortedMilestones.find((milestone) => milestone.dueDate);
                    const nextReminder = nextMilestone?.scheduledReminders?.[0];
                    const note = noteByGrant[grant.id] ?? "";
                    const priorityColor = PRIORITY_COLORS[grant.priority] ?? "gray";
                    return (
                      <Paper key={grant.id} withBorder radius="lg" p="md" variant="surfaceSunken">
                        <Stack gap="sm">
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={2}>
                              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                                {grant.agency}
                              </Text>
                              <Text fw={600}>{grant.title}</Text>
                            </Stack>
                            <Anchor component={Link} href={`/grants/${encodeURIComponent(grant.id)}`} size="xs">
                              Details
                            </Anchor>
                          </Group>
                          <Group gap="xs" wrap="wrap">
                            <Badge color={priorityColor} variant="light">
                              {grant.priority} priority
                            </Badge>
                            {grant.owner && (
                              <Badge color="midnight" variant="light">
                                Owner: {grant.owner}
                              </Badge>
                            )}
                            {nextMilestone?.dueDate && (
                              <Badge color="blue" variant="light">
                                {nextMilestone.label} · {new Date(nextMilestone.dueDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </Group>
                          {nextReminder && (
                            <Paper radius="md" p="sm" withBorder variant="surfaceOverlayStrong">
                              <Text size="xs" fw={600}>
                                Next reminder
                              </Text>
                              <Text size="xs" c="dimmed">
                                {nextReminder.channel === "email" ? "Email" : "SMS"} {describeOffset(nextReminder.offsetDays)} · {formatReminderDate(nextReminder.sendAt, timezone)}
                              </Text>
                            </Paper>
                          )}
                          <Select
                            label="Move to"
                            data={STAGES.map((value) => ({ value, label: value }))}
                            value={grant.stage}
                            onChange={(value) => {
                              if (!value) return;
                              updateGrantStage(grant.id, value as Stage, note ? `Note: ${note}` : undefined);
                              setNoteByGrant((prev) => ({ ...prev, [grant.id]: "" }));
                            }}
                            size="xs"
                          />
                          <Textarea
                            placeholder="Add context for this move"
                            value={note}
                            size="xs"
                            autosize
                            minRows={2}
                            onChange={(event) =>
                              setNoteByGrant((prev) => ({ ...prev, [grant.id]: event.currentTarget.value }))
                            }
                          />
                          <Stack gap={4}>
                            <Text size="xs" fw={600}>
                              Stage history
                            </Text>
                            <Stack gap={4}>
                              {grant.history
                                .slice()
                                .reverse()
                                .map((entry, index) => (
                                  <Text key={`${grant.id}-history-${index}`} size="xs" c="dimmed">
                                    <Text component="span" fw={600} c="white">
                                      {entry.stage}
                                    </Text>{" "}
                                    on {new Date(entry.changedAt).toLocaleString()} {entry.note && `— ${entry.note}`}
                                  </Text>
                                ))}
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
