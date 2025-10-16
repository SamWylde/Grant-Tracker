"use client";

import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Code,
  Grid,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { IconPlayerPlay, IconRefresh } from "@tabler/icons-react";

const sortOptions = [
  { value: "closeDate|desc", label: "Close date (newest)" },
  { value: "closeDate|asc", label: "Close date (oldest)" },
  { value: "postedDate|desc", label: "Posted date (newest)" }
];

const scenarioPresets = [
  { label: "Test Basic Search", keyword: "education" },
  { label: "Test State Filter", keyword: "", state: "PA" },
  { label: "Test Category Filter", keyword: "", category: "Health" },
  { label: "Test Date Range", keyword: "", upcomingOnly: true },
  { label: "Test Invalid Request", keyword: "", invalid: true }
];

export default function GrantsGovTesterPage() {
  const [keyword, setKeyword] = useState("sustainability");
  const [state, setState] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(sortOptions[0]?.value ?? null);
  const [limit, setLimit] = useState(50);
  const [results, setResults] = useState<Array<Record<string, string>>>([]);
  const [loading, setLoading] = useState(false);

  const runPreset = (preset: (typeof scenarioPresets)[number]) => {
    setKeyword(preset.keyword ?? "");
    setState(preset.state ?? null);
    setCategory(preset.category ?? null);
    if (preset.upcomingOnly) {
      setSortBy("closeDate|asc");
    }
    if (preset.invalid) {
      setLimit(2000);
    }
  };

  const executeTest = async () => {
    setLoading(true);
    try {
      const mockRows = Array.from({ length: Math.min(limit, 5) }).map((_, index) => ({
        opportunityNumber: `FAKE-${index + 1}`,
        title: `Mock opportunity ${index + 1}`,
        agency: "Example Agency",
        closeDate: "2024-12-31",
        postedDate: "2024-05-01"
      }));
      setResults(mockRows);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>Grants.gov API tester</Title>
        <Text size="sm" c="dimmed">
          Compose REST requests against the Grants.gov opportunities search endpoint. Use presets to quickly validate filters before
          wiring them into the product experience.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Keyword" value={keyword} onChange={(event) => setKeyword(event.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="Sort by"
                data={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                placeholder="Select sort"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <NumberInput
                label="Number of records"
                value={limit}
                min={1}
                max={1000}
                onChange={(value) => setLimit(Number(value) || 0)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput label="State" value={state ?? ""} onChange={(event) => setState(event.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label="Category"
                value={category ?? ""}
                onChange={(event) => setCategory(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch label="Upcoming closing dates only" />
            </Grid.Col>
          </Grid>

          <Group>
            <Button leftSection={<IconPlayerPlay size={16} />} onClick={executeTest} loading={loading} color="midnight">
              Run test
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setKeyword("sustainability");
                setState(null);
                setCategory(null);
                setLimit(50);
                setSortBy(sortOptions[0]?.value ?? null);
              }}
            >
              Reset form
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <Title order={4}>Preset scenarios</Title>
            <Badge color="midnight" variant="light">
              {scenarioPresets.length}
            </Badge>
          </Group>
          <Grid gutter="md">
            {scenarioPresets.map((preset) => (
              <Grid.Col key={preset.label} span={{ base: 12, md: 6, lg: 4 }}>
                <Card withBorder radius="md" padding="md">
                  <Stack gap="xs">
                    <Text fw={600}>{preset.label}</Text>
                    <Text size="xs" c="dimmed">
                      Keyword: {preset.keyword || "—"}
                    </Text>
                    {preset.state ? (
                      <Text size="xs" c="dimmed">
                        State: {preset.state}
                      </Text>
                    ) : null}
                    {preset.category ? (
                      <Text size="xs" c="dimmed">
                        Category: {preset.category}
                      </Text>
                    ) : null}
                    <Button size="xs" variant="light" onClick={() => runPreset(preset)}>
                      Load preset
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={4}>Response preview</Title>
            <Badge color="midnight" variant="light">
              Mock mode
            </Badge>
          </Group>
          <Paper withBorder radius="md" p="sm" variant="surface">
            <Code block>
              {JSON.stringify(
                {
                  endpoint: "https://www.grants.gov/grantsws/rest/opportunities/search",
                  params: {
                    keyword,
                    state,
                    category,
                    sortBy,
                    numberOfRecords: limit
                  }
                },
                null,
                2
              )}
            </Code>
          </Paper>
          <ScrollArea h={220} type="auto">
            <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm" striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Opportunity #</Table.Th>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Agency</Table.Th>
                  <Table.Th>Close date</Table.Th>
                  <Table.Th>Posted date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {results.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        Run a test query to populate sample results.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  results.map((row) => (
                    <Table.Tr key={row.opportunityNumber}>
                      <Table.Td>{row.opportunityNumber}</Table.Td>
                      <Table.Td>{row.title}</Table.Td>
                      <Table.Td>{row.agency}</Table.Td>
                      <Table.Td>{row.closeDate}</Table.Td>
                      <Table.Td>{row.postedDate}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Card>
    </Stack>
  );
}
