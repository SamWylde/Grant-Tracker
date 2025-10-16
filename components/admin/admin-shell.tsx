"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title
} from "@mantine/core";

import type { AdminContext } from "@/lib/admin/auth";
import { useAuth } from "../auth-context";

const NAV_SECTIONS: Array<{
  title: string;
  items: Array<{ label: string; href: string; description?: string }>;
}> = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Audit Logs", href: "/admin/audit" }
    ]
  },
  {
    title: "Data",
    items: [
      { label: "SQL Query", href: "/admin/sql" },
      { label: "Database Browser", href: "/admin/database" },
      { label: "API Tester", href: "/admin/api-test/grants-gov" }
    ]
  },
  {
    title: "Management",
    items: [
      { label: "Organizations", href: "/admin/orgs" },
      { label: "Users", href: "/admin/users" },
      { label: "System Health", href: "/admin/system" }
    ]
  },
  {
    title: "Resources",
    items: [
      { label: "Documentation", href: "/admin/docs" }
    ]
  }
];

function SidebarLink({ href, label, description }: { href: string; label: string; description?: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Anchor
      component={Link}
      href={href}
      underline="never"
      style={{ width: "100%" }}
      data-active={isActive || undefined}
    >
      <Stack
        gap={2}
        px="md"
        py="sm"
        style={{
          borderRadius: "0.75rem",
          backgroundColor: isActive ? "rgba(94, 234, 212, 0.16)" : "transparent",
          border: isActive ? "1px solid rgba(94, 234, 212, 0.35)" : "1px solid transparent",
          transition: "background-color 120ms ease, border-color 120ms ease"
        }}
      >
        <Text fw={600} size="sm" c={isActive ? "teal.2" : "gray.1"}>
          {label}
        </Text>
        {description && (
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>
    </Anchor>
  );
}

export function AdminAppShell({
  context,
  children
}: {
  context: AdminContext;
  children: React.ReactNode;
}) {
  const { signOut } = useAuth();

  return (
    <Flex mih="100vh" bg="#0b1220" c="gray.1">
      <Box
        component="aside"
        w={280}
        px="lg"
        py="xl"
        style={{
          borderRight: "1px solid rgba(148, 163, 184, 0.16)",
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.6) 100%)",
          backdropFilter: "blur(12px)"
        }}
      >
        <Stack gap="xl" h="100%">
          <Stack gap={4}>
            <Title order={3} c="gray.0">
              Admin Console
            </Title>
            <Text size="xs" c="dimmed">
              Platform insights and controls for power users.
            </Text>
          </Stack>

          <Stack gap="xs">
            {NAV_SECTIONS.map((section) => (
              <Stack key={section.title} gap={6}>
                <Text size="xs" fw={600} c="gray.5" tt="uppercase">
                  {section.title}
                </Text>
                <Stack gap={6}>
                  {section.items.map((item) => (
                    <SidebarLink key={item.href} {...item} />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Stack gap="xs" mt="auto">
            <Text size="xs" c="dimmed">
              Signed in as
            </Text>
            <Group gap={6} align="center">
              <Badge color="teal" variant="light" radius="md">
                {context.isPlatformAdmin ? "Platform admin" : "Org admin"}
              </Badge>
              {context.email && (
                <Text size="sm" fw={600} c="gray.0">
                  {context.email}
                </Text>
              )}
            </Group>
            <Button size="xs" variant="light" color="red" onClick={() => signOut()}>
              Sign out
            </Button>
          </Stack>
        </Stack>
      </Box>

      <ScrollArea type="auto" style={{ flex: 1 }}>
        <Box px="xl" py="xl" maw={1400} mx="auto">
          {children}
        </Box>
      </ScrollArea>
    </Flex>
  );
}
