"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button, Group, Paper, Stack, Text, TextInput, Title } from "@mantine/core";

import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const { signInWithPassword, signOut, user, membership, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const result = await signInWithPassword(email, password);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Check your workspace for imported opportunities.");
    }
  };

  return (
    <Stack align="center" justify="center" py="xl" mx="auto" maw={420}>
      <Paper withBorder radius="xl" p="xl" bg="rgba(8,18,40,0.7)">
        <Stack gap="md" align="center" ta="center">
          <Title order={2}>Sign in to Grant Tracker</Title>
          <Text size="sm" c="dimmed">
            Use your Supabase credentials. Admins can invite teammates from org settings.
          </Text>
        </Stack>
        <Stack gap="md" mt="lg">
          {isLoading ? (
            <Text size="sm" c="dimmed" ta="center">
              Loading…
            </Text>
          ) : user ? (
            <Stack gap="sm">
              <Text fw={600}>You&apos;re signed in as {user.email ?? user.fullName}</Text>
              <Text size="xs" c="dimmed">
                Membership: {membership?.org?.name ?? "No organization"} ({membership?.role ?? ""})
              </Text>
              <Group justify="center" gap="sm">
                <Button component={Link} href="/my-tasks" size="sm" variant="light" color="teal">
                  View my tasks
                </Button>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign out
                </Button>
              </Group>
            </Stack>
          ) : (
            <Paper component="form" withBorder radius="lg" p="md" bg="rgba(6,14,32,0.6)" onSubmit={handleSubmit}>
              <Stack gap="sm">
                <TextInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                />
                <Button type="submit" fullWidth>
                  Sign in
                </Button>
              </Stack>
            </Paper>
          )}
          {message && (
            <Text size="xs" c="dimmed" ta="center">
              {message}
            </Text>
          )}
          <Button component={Link} href="/" variant="subtle" size="xs">
            Return to marketing site
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
