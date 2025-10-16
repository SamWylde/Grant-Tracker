"use client";

import { Anchor, Card, Code, Group, List, Stack, Text, Title } from "@mantine/core";

export default function AdminDocsPage() {
  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Admin panel documentation</Title>
        <Text size="sm" c="dimmed">
          Reference for platform administrators. These notes outline what&apos;s currently implemented and what remains on the roadmap as the
          /admin experience matures.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>User guide</Title>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>Use the SQL workbench for ad-hoc debugging. Start in read-only mode, then disable it for writes if required.</List.Item>
            <List.Item>Database browser surfaces schema metadata, table sizes, and RLS policy status.</List.Item>
            <List.Item>API tester pages help validate Grants.gov, Stripe, and messaging integrations without leaving the console.</List.Item>
            <List.Item>Organization and user management tooling centralizes platform-wide support tasks.</List.Item>
          </List>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>Database functions</Title>
          <Text size="sm" c="dimmed">
            Common helpers available in the Supabase project:
          </Text>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>
              <Code>set_updated_at()</Code> — Trigger used on most tables to auto-populate <Code>updated_at</Code> columns.
            </List.Item>
            <List.Item>
              <Code>accept_org_invite(token text)</Code> — Handles invite acceptance and membership activation.
            </List.Item>
          </List>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>API reference</Title>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>
              <Code>POST /api/admin/query</Code> — Execute SQL statements through the service role. Payload: <Code>{`{ sql, readOnlyMode }`}</Code>.
            </List.Item>
            <List.Item>
              <Code>POST /api/admin/test-grants</Code> — Planned Grants.gov tester endpoint.
            </List.Item>
            <List.Item>
              <Code>POST /api/admin/test-email</Code> — Planned messaging test endpoint.
            </List.Item>
          </List>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>Security guidelines</Title>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>Queries default to read-only. Disable cautiously and confirm statements before executing.</List.Item>
            <List.Item>Audit logs capture every admin action. Review them regularly for suspicious activity.</List.Item>
            <List.Item>
              Rate limits apply: 100 SQL queries per admin per hour by default (configure via
              <Code>ADMIN_RATE_LIMIT_QUERIES_PER_HOUR</Code>).
            </List.Item>
            <List.Item>Require 2FA for platform admins and rotate service-role keys periodically.</List.Item>
          </List>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={4}>Example SQL snippets</Title>
          <List size="sm" spacing="sm" withPadding>
            <List.Item>
              <Code>SELECT name, created_at FROM orgs WHERE grants_count &gt;= 10;</Code>
            </List.Item>
            <List.Item>
              <Code>SELECT email FROM users WHERE last_login &lt; now() - interval &#39;90 days&#39;;</Code>
            </List.Item>
            <List.Item>
              <Code>SELECT * FROM reminder_jobs WHERE status = &#39;pending&#39; ORDER BY scheduled_for;</Code>
            </List.Item>
          </List>
          <Text size="xs" c="dimmed">
            These examples are intended for local environments. Confirm table names in production before executing.
          </Text>
        </Stack>
      </Card>

      <Group>
        <Anchor href="/admin">Return to admin dashboard</Anchor>
      </Group>
    </Stack>
  );
}
