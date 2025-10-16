"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title
} from "@mantine/core";

import { RoleGate } from "./role-gate";
import { useAuth } from "./auth-context";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "contributor", label: "Contributor" }
] as const;

export function OrgInviteManager() {
  const { invites, inviteMember, revokeInvite, membership, user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("contributor");
  const [status, setStatus] = useState<string | null>(null);

  const activeInvites = useMemo(() => invites.filter((invite) => invite.status !== "inactive"), [invites]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("Enter an email to invite.");
      return;
    }
    const result = await inviteMember(trimmed, role);
    if (result.error) {
      setStatus(result.error);
    } else {
      setEmail("");
      setRole("contributor");
      setStatus("Invite sent.");
    }
  }

  return (
    <RoleGate
      role="admin"
      fallback={
        <Paper withBorder radius="lg" p="md" variant="surfaceIndigo">
          <Text size="sm" c="dimmed">
            Only admins can manage organization invites.
          </Text>
        </Paper>
      }
    >
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={4}>Invite teammates</Title>
          <Text size="sm" c="dimmed">
            Send an email invite so teammates can join {membership?.org?.name ?? "your organization"}.
          </Text>
        </Stack>
        <Paper
          component="form"
          withBorder
          radius="lg"
          p="lg"
          variant="surfaceIndigo"
          onSubmit={handleSubmit}
        >
          <Stack gap="md">
            <Group gap="md" grow align="flex-end">
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="teammate@nonprofit.org"
                required
              />
              <Select
                label="Role"
                data={ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                value={role}
                onChange={(value) => setRole((value as typeof role) ?? "contributor")}
              />
            </Group>
            <Group justify="space-between" align="center">
              <Button type="submit" size="sm" radius="md">
                Send invite
              </Button>
              {status && (
                <Text size="xs" c="dimmed">
                  {status}
                </Text>
              )}
            </Group>
          </Stack>
        </Paper>
        <Paper withBorder radius="lg" variant="surfaceIndigo">
          <Group justify="space-between" align="center" px="lg" py="sm">
            <Text size="sm" fw={600}>
              Pending invites
            </Text>
            <Badge variant="light" color="midnight">
              {activeInvites.length}
            </Badge>
          </Group>
          <Stack gap={0}>
            {activeInvites.length === 0 ? (
              <Text px="lg" py="md" size="sm" c="dimmed">
                No outstanding invites.
              </Text>
            ) : (
              activeInvites.map((invite) => (
                <Group
                  key={invite.id}
                  justify="space-between"
                  align="flex-start"
                  px="lg"
                  py="md"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  wrap="nowrap"
                >
                  <Stack gap={4}>
                    <Text fw={600}>{invite.email}</Text>
                    <Text size="xs" c="dimmed">
                      Role: {invite.role} • Invited by {invite.invitedBy || user?.email || "unknown"}
                    </Text>
                    {invite.token && (
                      <Text size="xs" c="dimmed" fw={500}>
                        Token: {invite.token}
                      </Text>
                    )}
                  </Stack>
                  <Button
                    variant="outline"
                    color="red"
                    size="xs"
                    onClick={async () => {
                      const result = await revokeInvite(invite.id);
                      if (result.error) {
                        setStatus(result.error);
                      }
                    }}
                  >
                    Revoke
                  </Button>
                </Group>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>
    </RoleGate>
  );
}
