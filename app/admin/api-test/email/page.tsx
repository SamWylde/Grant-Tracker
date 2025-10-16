"use client";

import { Paper, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";

export default function MessagingTesterPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Email & SMS sandbox
        </Title>
        <Text size="sm" c="dimmed">
          Configure Postmark or Twilio credentials in environment variables to enable live test sends. Messages triggered here
          will be tagged in the audit log for traceability.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
          <Stack gap="sm">
            <Title order={4} size="h5">
              Email preview
            </Title>
            <TextInput label="Recipient" placeholder="team@example.org" disabled />
            <TextInput label="Subject" placeholder="Grant reminder test" disabled />
            <Textarea label="Body" minRows={6} placeholder="Compose a message to preview formatting." disabled />
          </Stack>
        </Paper>
        <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
          <Stack gap="sm">
            <Title order={4} size="h5">
              SMS template
            </Title>
            <TextInput label="Phone number" placeholder="+1 (555) 123-4567" disabled />
            <Textarea label="Message" minRows={4} placeholder="Reminder: submit quarterly report" disabled />
            <Text size="xs" c="dimmed">
              Enable the Twilio integration to unlock direct send testing from this console.
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
