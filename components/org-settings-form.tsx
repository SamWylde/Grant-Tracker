"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Chip,
  CopyButton,
  Divider,
  Grid,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import { IconAlertCircle, IconCalendarCog, IconCopy, IconRefresh } from "@tabler/icons-react";

import { getUniqueFocusAreas, getUniqueStates } from "@/lib/grants";
import { describeOffset } from "@/lib/reminders";
import { generateIcsFeed } from "@/lib/calendar";

import { useGrantContext } from "./grant-context";
import { OrgInviteManager } from "./org-invite-manager";

const PRIORITY_FOCUS_OPTIONS = [
  { value: "Economic Development", label: "Economic Development" },
  { value: "Rural Development", label: "Rural Development" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "Health", label: "Health" },
  { value: "Environment", label: "Environment" },
  { value: "Education", label: "Education" },
  { value: "Technology", label: "Technology" },
  { value: "Public Facilities", label: "Public Facilities" }
];

const REMINDER_CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" }
] as const;

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC"
];

function generateSecureSecret() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  throw new Error("Crypto API not available for secure token generation");
}

export function OrgSettingsForm() {
  const {
    allGrants,
    orgPreferences,
    savedGrants,
    updatePreferences,
    syncStatus,
    clearSyncError,
    hydrationState,
    hydrationError
  } = useGrantContext();
  const [icsDownloading, setIcsDownloading] = useState(false);

  const states = useMemo(() => getUniqueStates(allGrants), [allGrants]);
  const focusAreas = useMemo(() => {
    const existing = new Set(getUniqueFocusAreas(allGrants));
    for (const option of PRIORITY_FOCUS_OPTIONS) {
      existing.add(option.value);
    }
    return Array.from(existing).sort((a, b) => a.localeCompare(b));
  }, [allGrants]);

  useEffect(() => {
    if (!orgPreferences.timezone) {
      updatePreferences({
        ...orgPreferences,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icsFeedUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.grant-tracker.local";
    return `${base}/api/calendar/${orgPreferences.calendar.icsSecret}.ics`;
  }, [orgPreferences.calendar.icsSecret]);

  const milestonesWithReminders = useMemo(() => {
    const offsets = new Set<number>();
    for (const grant of Object.values(savedGrants)) {
      for (const milestone of grant.milestones ?? []) {
        for (const reminder of milestone.scheduledReminders ?? []) {
          offsets.add(reminder.offsetDays);
        }
      }
    }
    return Array.from(offsets).sort((a, b) => a - b).map((offset) => describeOffset(offset));
  }, [savedGrants]);

  return (
    <Stack
      gap="xl"
      component={Paper}
      withBorder
      radius="xl"
      p="xl"
      variant="surfacePrimary"
    >
      <Stack gap="sm">
        <Title order={3}>Org onboarding defaults</Title>
        <Text size="sm" c="dimmed">
          Choose the geographies and focus areas you care about most. We use these preferences to surface the most relevant grants by default whenever you revisit the app.
        </Text>
        {hydrationState === "error" && hydrationError && (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
            <Text fw={600}>{hydrationError}</Text>
            <Text size="xs" mt={4}>
              Refresh the page or try again later once your connection is stable.
            </Text>
          </Alert>
        )}
        {syncStatus.error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            withCloseButton
            onClose={clearSyncError}
          >
            <Text fw={600}>{syncStatus.error}</Text>
            <Text size="xs" mt={4}>
              We will keep trying to sync in the background.
            </Text>
          </Alert>
        )}
      </Stack>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Focus geographies
            </Text>
            <Text size="xs" c="dimmed">
              Select up to five states that align with your programs.
            </Text>
            <Chip.Group
              multiple
              value={orgPreferences.states}
              onChange={(value) => {
                const next = value.slice(0, 5);
                updatePreferences({ ...orgPreferences, states: next });
              }}
            >
              <Group gap="xs">
                {states.map((state) => (
                  <Chip key={state} value={state} radius="xl" variant="light" color="midnight">
                    {state}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Focus areas
            </Text>
            <Text size="xs" c="dimmed">
              We recommend grants that match at least one of these focus areas.
            </Text>
            <Chip.Group
              multiple
              value={orgPreferences.focusAreas}
              onChange={(value) => {
                const next = value.slice(0, 6);
                updatePreferences({ ...orgPreferences, focusAreas: next });
              }}
            >
              <Group gap="xs">
                {focusAreas.map((focus) => (
                  <Chip key={focus} value={focus} radius="xl" variant="light" color="blue">
                    {focus}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Stack>
        </Grid.Col>
      </Grid>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder radius="lg" p="lg" variant="surfaceDeep">
            <Stack gap="md">
              <Group gap="xs">
                <IconCalendarCog size="1.1rem" />
                <Text fw={600}>Deadline reminders</Text>
              </Group>
              <Select
                label="Timezone"
                data={TIMEZONE_OPTIONS.map((zone) => ({ value: zone, label: zone }))}
                value={orgPreferences.timezone}
                onChange={(value) =>
                  updatePreferences({
                    ...orgPreferences,
                    timezone: value ?? orgPreferences.timezone
                  })
                }
              />
              <MultiSelect
                label="Default channels"
                data={REMINDER_CHANNEL_OPTIONS.map((option) => option)}
                value={orgPreferences.reminderChannels}
                onChange={(value) =>
                  updatePreferences({
                    ...orgPreferences,
                    reminderChannels: value.length > 0 ? value : ["email"]
                  })
                }
                withinPortal={false}
                searchable={false}
                description={`Reminders currently scheduled: ${milestonesWithReminders.join(", ") || "None yet"}.`}
              />
              <TextInput
                label="Unsubscribe URL"
                placeholder="https://example.org/unsubscribe"
                value={orgPreferences.unsubscribeUrl}
                onChange={(event) =>
                  updatePreferences({
                    ...orgPreferences,
                    unsubscribeUrl: event.currentTarget.value
                  })
                }
              />
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper withBorder radius="lg" p="lg" variant="surfaceDeep">
            <Stack gap="md">
              <Group gap="xs">
                <IconCalendarCog size="1.1rem" />
                <Text fw={600}>Calendar sync</Text>
              </Group>
              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                  Secure ICS feed
                </Text>
                <Paper radius="sm" p="sm" withBorder variant="surfaceSunkenStrong">
                  <Text size="xs" style={{ wordBreak: "break-all" }}>
                    {icsFeedUrl}
                  </Text>
                </Paper>
                <Group gap="sm">
                  <CopyButton value={icsFeedUrl} timeout={2000}>
                    {({ copy, copied }) => (
                      <Button
                        leftSection={<IconCopy size="1rem" />}
                        variant="light"
                        size="xs"
                        onClick={copy}
                      >
                        {copied ? "Copied" : "Copy link"}
                      </Button>
                    )}
                  </CopyButton>
                  <Tooltip label="Generate a new private link" withArrow>
                    <ActionIcon
                      variant="light"
                      color="midnight"
                      onClick={() => {
                        updatePreferences({
                          ...orgPreferences,
                          calendar: {
                            ...orgPreferences.calendar,
                            icsSecret: generateSecureSecret()
                          }
                        });
                      }}
                    >
                      <IconRefresh size="1rem" />
                    </ActionIcon>
                  </Tooltip>
                  <Button
                    variant="outline"
                    size="xs"
                    loading={icsDownloading}
                    onClick={async () => {
                      if (icsDownloading) return;
                      setIcsDownloading(true);
                      try {
                        const grants = Object.values(savedGrants).map((grant) => {
                          if (!Array.isArray(grant.milestones)) {
                            throw new Error(`Grant ${grant.id} is missing milestones. Unable to build ICS feed.`);
                          }
                          return {
                            id: grant.id,
                            title: grant.title,
                            milestones: grant.milestones.map((milestone) => ({
                              label: milestone.label,
                              dueDate: milestone.dueDate
                            }))
                          };
                        });
                        const ics = generateIcsFeed({
                          grants,
                          timezone: orgPreferences.timezone,
                          orgName: "Grant Tracker"
                        });
                        const blob = new Blob([ics], { type: "text/calendar" });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.download = `grant-tracker-${orgPreferences.calendar.icsSecret}.ics`;
                        document.body.appendChild(anchor);
                        anchor.click();
                        document.body.removeChild(anchor);
                        URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Failed to generate ICS feed", error);
                      } finally {
                        setIcsDownloading(false);
                      }
                    }}
                  >
                    Download ICS
                  </Button>
                </Group>
                <Text size="xs" c="dimmed">
                  Last refreshed {orgPreferences.calendar.lastGeneratedAt ? new Date(orgPreferences.calendar.lastGeneratedAt).toLocaleString() : "never"}.
                </Text>
              </Stack>

              <Divider variant="dashed" color="rgba(255,255,255,0.1)" />

              <Stack gap="sm">
                <Group gap="sm">
                  <Text size="xs" fw={600} tt="uppercase">
                    Google Calendar (Pro)
                  </Text>
                  <Badge color={
                    orgPreferences.calendar.googleOAuthStatus === "connected"
                      ? "teal"
                      : orgPreferences.calendar.googleOAuthStatus === "expired"
                      ? "yellow"
                      : "gray"
                  }>
                    {orgPreferences.calendar.googleOAuthStatus === "connected"
                      ? "Connected"
                      : orgPreferences.calendar.googleOAuthStatus === "expired"
                      ? "Token expired"
                      : "Not connected"}
                  </Badge>
                </Group>
                {orgPreferences.calendar.googleOAuthStatus !== "connected" ? (
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() =>
                      updatePreferences({
                        ...orgPreferences,
                        calendar: {
                          ...orgPreferences.calendar,
                          googleOAuthStatus: "connected",
                          googleSyncEnabled: true,
                          googleCalendarId: "primary"
                        }
                      })
                    }
                  >
                    Connect Google
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    color="red"
                    size="xs"
                    onClick={() =>
                      updatePreferences({
                        ...orgPreferences,
                        calendar: {
                          ...orgPreferences.calendar,
                          googleOAuthStatus: "disconnected",
                          googleSyncEnabled: false,
                          googleCalendarId: null
                        }
                      })
                    }
                  >
                    Disconnect
                  </Button>
                )}
                <Switch
                  label="Enable bidirectional sync"
                  checked={orgPreferences.calendar.googleSyncEnabled}
                  onChange={(event) =>
                    updatePreferences({
                      ...orgPreferences,
                      calendar: {
                        ...orgPreferences.calendar,
                        googleSyncEnabled: event.currentTarget.checked
                      }
                    })
                  }
                />
                <Stack gap={6}>
                  <Switch
                    label="Create new events for milestone deadlines"
                    checked={orgPreferences.calendar.syncCreate}
                    disabled={!orgPreferences.calendar.googleSyncEnabled}
                    onChange={(event) =>
                      updatePreferences({
                        ...orgPreferences,
                        calendar: {
                          ...orgPreferences.calendar,
                          syncCreate: event.currentTarget.checked
                        }
                      })
                    }
                  />
                  <Switch
                    label="Update events when milestones shift"
                    checked={orgPreferences.calendar.syncUpdate}
                    disabled={!orgPreferences.calendar.googleSyncEnabled}
                    onChange={(event) =>
                      updatePreferences({
                        ...orgPreferences,
                        calendar: {
                          ...orgPreferences.calendar,
                          syncUpdate: event.currentTarget.checked
                        }
                      })
                    }
                  />
                  <Switch
                    label="Remove events if a milestone is cancelled"
                    checked={orgPreferences.calendar.syncDelete}
                    disabled={!orgPreferences.calendar.googleSyncEnabled}
                    onChange={(event) =>
                      updatePreferences({
                        ...orgPreferences,
                        calendar: {
                          ...orgPreferences.calendar,
                          syncDelete: event.currentTarget.checked
                        }
                      })
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Divider variant="dashed" color="rgba(255,255,255,0.1)" />

      <OrgInviteManager />
    </Stack>
  );
}
