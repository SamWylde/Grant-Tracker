"use client";

import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title
} from "@mantine/core";
import { IconMail, IconMessage } from "@tabler/icons-react";

export default function MessagingTesterPage() {
  const [email, setEmail] = useState("demo@example.org");
  const [message, setMessage] = useState("Hello from the Grant Tracker admin console!");
  const [useSms, setUseSms] = useState(false);

  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Email & SMS testing</Title>
        <Text size="sm" c="dimmed">
          Send test communications through Postmark (email) and Twilio (SMS). Messages are logged to the admin audit table for traceability.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <Group>
            <Switch
              label="Send SMS instead of email"
              checked={useSms}
              onChange={(event) => setUseSms(event.currentTarget.checked)}
            />
            <Badge color="midnight" variant="light">
              Mock mode
            </Badge>
          </Group>
          <TextInput
            label={useSms ? "Recipient phone" : "Recipient email"}
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <Textarea label="Message" value={message} onChange={(event) => setMessage(event.currentTarget.value)} autosize minRows={4} />
          <Group>
            <Button color="midnight" leftSection={useSms ? <IconMessage size={16} /> : <IconMail size={16} />}
              disabled
            >
              {useSms ? "Send SMS" : "Send email"}
            </Button>
            <Text size="xs" c="dimmed">
              Outbound integrations will be wired up once credentials are provided. This UI will then call the admin API to deliver
              messages.
            </Text>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
