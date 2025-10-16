"use client";

import { Container, Paper, Stack, Text, Title } from "@mantine/core";

import { GrantDetailView } from "@/components/grant-detail-view";
import { RoleGate } from "@/components/role-gate";

export default function GrantDetailPage({
  params
}: {
  params: { id: string };
}) {
  const decodedId = decodeURIComponent(params.id);

  return (
    <Container size="xl" py="xl">
      <RoleGate
        role="contributor"
        fallback={
          <Paper withBorder radius="xl" p="xl" variant="surfacePrimary">
            <Stack align="center" gap="sm" ta="center">
              <Title order={3}>Access requires a grant workspace seat</Title>
              <Text size="sm" c="dimmed">
                Ask an admin to invite you to the organization or accept your pending invite from email.
              </Text>
            </Stack>
          </Paper>
        }
      >
        <GrantDetailView grantId={decodedId} />
      </RoleGate>
    </Container>
  );
}
