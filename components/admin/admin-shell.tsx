"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconActivity,
  IconApi,
  IconBook,
  IconDatabase,
  IconDeviceAnalytics,
  IconHistory,
  IconHome,
  IconReportAnalytics,
  IconSettings,
  IconUsersGroup
} from "@tabler/icons-react";

import type { AdminOrgAccess, AdminUser } from "@/lib/admin/auth";

type NavIcon = React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }>;

const NAV_SECTIONS: Array<{
  label: string;
  items: Array<{
    label: string;
    description?: string;
    href: string;
    icon: NavIcon;
  }>;
}> = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: IconHome },
      { label: "SQL Query", href: "/admin/sql", icon: IconDatabase }
    ]
  },
  {
    label: "Data Management",
    items: [
      { label: "Database Browser", href: "/admin/database", icon: IconReportAnalytics },
      { label: "Organizations", href: "/admin/orgs", icon: IconSettings },
      { label: "Users", href: "/admin/users", icon: IconUsersGroup }
    ]
  },
  {
    label: "Integrations",
    items: [
      { label: "Grants.gov API", href: "/admin/api-test/grants-gov", icon: IconApi },
      { label: "Stripe", href: "/admin/api-test/stripe", icon: IconDeviceAnalytics },
      { label: "Email & SMS", href: "/admin/api-test/email", icon: IconActivity }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "System Health", href: "/admin/system", icon: IconHistory },
      { label: "Audit Logs", href: "/admin/audit", icon: IconDatabase },
      { label: "Documentation", href: "/admin/docs", icon: IconBook }
    ]
  }
];

function AdminNavLink({
  label,
  href,
  icon: Icon,
  active,
  onNavigate
}: {
  label: string;
  href: string;
  icon: NavIcon;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <UnstyledButton
      component={Link}
      href={href}
      onClick={onNavigate}
      data-active={active || undefined}
      style={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.sm,
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderRadius: theme.radius.md,
        backgroundColor: active ? theme.colors.dark[6] : undefined,
        color: active ? theme.white : theme.colors.gray[3],
        transition: "background-color 150ms ease, color 150ms ease"
      })}
    >
      <ThemeIcon size={28} radius="md" variant={active ? "filled" : "light"} color={active ? "midnight" : "dark.6"}>
        <Icon size={16} />
      </ThemeIcon>
      <Text size="sm" fw={active ? 600 : 500}>
        {label}
      </Text>
    </UnstyledButton>
  );
}

export type AdminShellProps = {
  children: React.ReactNode;
  currentUser: AdminUser;
  isPlatformAdmin: boolean;
  organizations: AdminOrgAccess[];
};

export function AdminShell({ children, currentUser, isPlatformAdmin, organizations }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);

  const navigation = useMemo(() => {
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        active: pathname.startsWith(item.href)
      }))
    }));
  }, [pathname]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: "lg", collapsed: { mobile: !mobileOpened } }}
      padding="md"
      withBorder
      styles={(theme) => ({
        main: {
          backgroundColor: theme.colors.dark[8]
        }
      })}
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group gap="sm">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="lg" size="sm" />
            <Text fw={700}>Grant Tracker Admin</Text>
          </Group>
          <Group gap="sm">
            <Stack gap={0} align="flex-end" pb={2}>
              <Text size="sm" fw={600}>
                {currentUser.fullName ?? currentUser.email ?? "Admin"}
              </Text>
              <Text size="xs" c="dimmed">
                {currentUser.email ?? "Unknown email"}
              </Text>
            </Stack>
            {isPlatformAdmin ? <Badge color="teal">Platform admin</Badge> : null}
            <Button component={Link} href="/dashboard" variant="light" color="midnight" radius="md">
              Exit admin
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea} mx="-md" px="md">
          <Stack gap="lg">
            {navigation.map((section) => (
              <Stack key={section.label} gap="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  {section.label}
                </Text>
                <Stack gap={4}>
                  {section.items.map((item) => (
                    <AdminNavLink
                      key={item.href}
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                      active={item.active}
                      onNavigate={closeMobile}
                    />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </AppShell.Section>
        <Divider my="sm" variant="dashed" />
        <AppShell.Section>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={600}>
              Org context
            </Text>
            {isPlatformAdmin && organizations.length === 0 ? (
              <Text size="xs" c="dimmed">
                Platform administrators can operate across all organizations.
              </Text>
            ) : null}
            {!isPlatformAdmin && organizations.length === 0 ? (
              <Text size="xs" c="dimmed">
                No admin organizations detected. Access is limited until you are assigned to an org as admin.
              </Text>
            ) : null}
            {organizations.length > 0 ? (
              <Stack gap={4}>
                {organizations.map((org) => (
                  <Box key={org.orgId}>
                    <Text size="sm" fw={600}>
                      {org.orgName ?? "Untitled organization"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Role: {org.role}
                    </Text>
                  </Box>
                ))}
              </Stack>
            ) : null}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <Box maw="100%" mx="auto">
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
