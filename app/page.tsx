"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Anchor, Container, List, Stack, Text, Title } from "@mantine/core";

type SectionLink = {
  label: string;
  description: ReactNode;
  href?: string;
};

type Section = {
  title: string;
  items: SectionLink[];
};

const SECTIONS: Section[] = [
  {
    title: "Workspace flows",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        description: "Overview of upcoming deadlines, assigned tasks, and workspace shortcuts."
      },
      {
        label: "Sign in",
        href: "/login",
        description: "Authenticate with email and password to unlock the prototype workspace."
      },
      {
        label: "My tasks",
        href: "/my-tasks",
        description: "Personal checklist of grant deliverables assigned to the current user."
      },
      {
        label: "Add a manual grant",
        href: "/grants/new",
        description: "Create an opportunity manually with owner, stages, reminders, and tasks."
      },
      {
        label: "Import grants from CSV",
        href: "/grants/import",
        description: "Upload a spreadsheet of opportunities to populate the workspace quickly."
      },
      {
        label: "Grant detail workspace",
        description: (
          <>
            Open any saved grant at
            {" "}
            <Text component="span" fw={600}>
              /grants/&lt;grant-id&gt;
            </Text>{" "}
            to review milestones, notes, attachments, and task progress.
          </>
        )
      }
    ]
  },
  {
    title: "Admin console",
    items: [
      {
        label: "Platform control center",
        href: "/admin",
        description: "Secure entry point for elevated operators with links to diagnostics and tools."
      },
      {
        label: "Organization directory",
        href: "/admin/orgs",
        description: "Browse tenants, membership counts, and subscription status."
      },
      {
        label: "User management",
        href: "/admin/users",
        description: "Search Supabase auth users, inspect memberships, and stage account actions."
      },
      {
        label: "Audit log",
        href: "/admin/audit",
        description: "Review administrative actions and API calls captured for compliance."
      },
      {
        label: "System health",
        href: "/admin/system",
        description: "Check background job queues and service availability indicators."
      },
      {
        label: "Database explorer",
        href: "/admin/database",
        description: "Inspect schema metadata, row counts, and RLS policies."
      },
      {
        label: "SQL workbench",
        href: "/admin/sql",
        description: "Run service-role queries with favorites, pagination, and export helpers."
      },
      {
        label: "Admin guide",
        href: "/admin/docs",
        description: "Reference documentation covering console features and recommended workflows."
      }
    ]
  },
  {
    title: "Integration sandboxes",
    items: [
      {
        label: "Grants.gov tester",
        href: "/admin/api-test/grants-gov",
        description: "Exercise search filters, API keys, and response parsing for the Grants.gov API."
      },
      {
        label: "Stripe integration checks",
        href: "/admin/api-test/stripe",
        description: "Planned surface for inspecting products, subscription events, and webhook payloads."
      },
      {
        label: "Email & SMS sandbox",
        href: "/admin/api-test/email",
        description: "Configure Postmark or Twilio credentials to send test notifications with audit tags."
      }
    ]
  }
];

export default function HomePage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>Grant Tracker prototype</Title>
          <Text size="sm" c="dimmed">
            Jump directly into any available page of the prototype workspace, admin console, or integration sandboxes using
            the index below.
          </Text>
        </Stack>

        <Stack gap="xl">
          {SECTIONS.map((section) => (
            <Stack key={section.title} gap="sm">
              <Title order={3} size="h4">
                {section.title}
              </Title>
              <List spacing="md" withPadding>
                {section.items.map((item) => (
                  <List.Item key={item.label}>
                    <Stack gap={2}>
                      {item.href ? (
                        <Anchor component={Link} href={item.href} fw={600}>
                          {item.label}
                        </Anchor>
                      ) : (
                        <Text fw={600}>{item.label}</Text>
                      )}
                      <Text size="sm" c="dimmed">
                        {item.description}
                      </Text>
                    </Stack>
                  </List.Item>
                ))}
              </List>
            </Stack>
          ))}
        </Stack>

        <Stack gap={4}>
          <Title order={3} size="h4">
            Need credentials?
          </Title>
          <Text size="sm" c="dimmed">
            Create a Supabase project and populate the grant tables, or wire up the provided demo environment variables in
            <Text component="span" fw={600}>
              {" "}.env.local
            </Text>
            . Without Supabase configured, the UI falls back to mocked data for exploration.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
