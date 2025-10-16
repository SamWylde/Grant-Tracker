"use client";

import { useId, useState } from "react";

import { Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core";

export function WaitlistForm() {
  const id = useId();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");

  if (submitted) {
    return (
      <Paper withBorder radius="xl" p="xl" variant="surfaceNavy">
        <Stack gap="sm">
          <Title order={4}>You are on the list!</Title>
          <Text size="sm" c="dimmed">
            Thanks for your interest. We will reach out within two business days with onboarding details.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      component="form"
      withBorder
      radius="xl"
      p="xl"
      variant="surfaceNavy"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>Join the early access waitlist</Title>
          <Text size="sm" c="dimmed">
            Tell us about your organization and we will schedule a guided onboarding session.
          </Text>
        </Stack>
        <Stack gap="sm">
          <TextInput
            id={`${id}-email`}
            label="Work email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            placeholder="you@ruralnonprofit.org"
          />
          <TextInput
            id={`${id}-org`}
            label="Organization name"
            required
            value={org}
            onChange={(event) => setOrg(event.currentTarget.value)}
            placeholder="River County Development Coalition"
          />
        </Stack>
        <Button type="submit" size="md" radius="xl">
          Request early access
        </Button>
        <Text size="xs" c="dimmed">
          We only email about onboarding. No spam, ever.
        </Text>
      </Stack>
    </Paper>
  );
}
