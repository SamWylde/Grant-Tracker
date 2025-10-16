"use client";

import { Anchor, List, Paper, Stack, Text, Title } from "@mantine/core";

export default function AdminDocsPage() {
  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Admin console guide
        </Title>
        <Text size="sm" c="dimmed">
          Reference for platform operators covering SQL tooling, data management, API testing, and security practices. This page
          doubles as a checklist for onboarding new administrators.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
        <Stack gap="sm">
          <Title order={3} size="h4">
            User guide
          </Title>
          <List spacing="sm" size="sm" c="dimmed">
            <List.Item>
              Use the SQL workbench to inspect data. Keep read-only mode enabled unless a change is required and double-check the
              confirmation modal before executing write statements.
            </List.Item>
            <List.Item>
              The database explorer surfaces schema metadata, row counts, and RLS policies. Use the quick actions to audit
              organizations, users, and reminder jobs.
            </List.Item>
            <List.Item>
              API testers proxy requests through the admin backend. Add your Grants.gov API key or Stripe secret as needed, and
              export results for troubleshooting.
            </List.Item>
            <List.Item>
              Security-sensitive actions (impersonation, deletions) require re-confirmation and are logged to `admin_audit_log`.
            </List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
        <Stack gap="sm">
          <Title order={3} size="h4">
            Function reference
          </Title>
          <List spacing="sm" size="sm" c="dimmed">
            <List.Item>
              <Text component="span" fw={600}>
                set_updated_at()
              </Text>{" "}
              — PostgreSQL trigger function to keep `updated_at` timestamps in sync.
            </List.Item>
            <List.Item>
              <Text component="span" fw={600}>
                accept_org_invite(token)
              </Text>{" "}
              — Accepts a pending organization invite using the provided token.
            </List.Item>
            <List.Item>
              Review Supabase functions in the schema to understand side effects before running manual SQL.
            </List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
        <Stack gap="sm">
          <Title order={3} size="h4">
            API reference
          </Title>
          <List spacing="sm" size="sm" c="dimmed">
            <List.Item>
              <Text component="span" fw={600}>
                POST /api/admin/query
              </Text>{" "}
              — Executes SQL statements using the service role connection. Payload supports read-only toggles and transactional
              execution.
            </List.Item>
            <List.Item>
              <Text component="span" fw={600}>
                POST /api/admin/test-grants
              </Text>{" "}
              — Proxies Grants.gov API requests with audit logging and rate limiting.
            </List.Item>
            <List.Item>
              Additional admin endpoints will power organization, user, and messaging management in upcoming releases.
            </List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" p="lg" variant="surfacePrimary">
        <Stack gap="sm">
          <Title order={3} size="h4">
            Security best practices
          </Title>
          <List spacing="sm" size="sm" c="dimmed">
            <List.Item>Rotate Supabase service role keys regularly and restrict access to platform administrators.</List.Item>
            <List.Item>Require 2FA on admin accounts and audit the `admin_audit_log` table weekly for anomalies.</List.Item>
            <List.Item>Mask sensitive values in screenshots or exports unless a customer escalation requires full detail.</List.Item>
            <List.Item>Report incidents immediately. Include the query text, action id, and impacted organization(s).</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" p="lg" variant="surfaceSunken">
        <Stack gap="sm">
          <Title order={4} size="h5">
            Helpful links
          </Title>
          <List spacing="sm" size="sm" c="dimmed">
            <List.Item>
              <Anchor href="https://www.grants.gov/web/grants/home.html" target="_blank" rel="noreferrer">
                Grants.gov documentation
              </Anchor>
            </List.Item>
            <List.Item>
              <Anchor href="https://supabase.com/docs" target="_blank" rel="noreferrer">
                Supabase docs
              </Anchor>
            </List.Item>
            <List.Item>
              <Anchor href="https://stripe.com/docs" target="_blank" rel="noreferrer">
                Stripe docs
              </Anchor>
            </List.Item>
          </List>
        </Stack>
      </Paper>
    </Stack>
  );
}
