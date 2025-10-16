"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  Chip,
  Grid,
  Group,
  Paper,
  Radio,
  ScrollArea,
  Stack,
  Text,
  Title
} from "@mantine/core";

import {
  applyGrantFilters,
  getUniqueFocusAreas,
  getUniqueStates,
  type GrantOpportunity
} from "@/lib/grants";

import { useGrantContext } from "./grant-context";

const DUE_OPTIONS = [
  { label: "Any due date", value: null },
  { label: "Due within 30 days", value: 30 },
  { label: "Due within 60 days", value: 60 },
  { label: "Due within 90 days", value: 90 }
];

const AMOUNT_OPTIONS = [
  { label: "Any amount", min: null, max: null },
  { label: "Under $50k", min: null, max: 50000 },
  { label: "$50k - $250k", min: 50000, max: 250000 },
  { label: "$250k - $1M", min: 250000, max: 1000000 },
  { label: "$1M+", min: 1000000, max: null }
];

type FiltersState = {
  states: string[];
  focusAreas: string[];
  dueWithinDays: number | null;
  minAward: number | null;
  maxAward: number | null;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "Not specified";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Rolling";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (error) {
    return value;
  }
}

export function GrantDiscovery() {
  const { allGrants, orgPreferences, savedGrants, toggleSaveGrant } = useGrantContext();

  const [filters, setFilters] = useState<FiltersState>({
    states: orgPreferences.states,
    focusAreas: orgPreferences.focusAreas,
    dueWithinDays: 60,
    minAward: null,
    maxAward: null
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      states: orgPreferences.states,
      focusAreas: orgPreferences.focusAreas
    }));
  }, [orgPreferences.states, orgPreferences.focusAreas]);

  const states = useMemo(() => getUniqueStates(allGrants), [allGrants]);
  const focusAreas = useMemo(() => getUniqueFocusAreas(allGrants), [allGrants]);

  const filteredGrants = useMemo(() => {
    return applyGrantFilters(allGrants, filters);
  }, [allGrants, filters]);

  const prioritizedGrants = useMemo(() => {
    if (filters.states.length === 0 && filters.focusAreas.length === 0) {
      return filteredGrants;
    }

    return filteredGrants.slice().sort((a, b) => {
      const aMatches = countMatches(a, filters);
      const bMatches = countMatches(b, filters);
      return bMatches - aMatches;
    });
  }, [filteredGrants, filters]);

  const savedGrantIds = useMemo(() => new Set(Object.keys(savedGrants)), [savedGrants]);

  return (
    <Paper withBorder radius="xl" p="xl" variant="surfacePrimarySoft">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={3} size="h3">
              Grant discovery pipeline
            </Title>
            <Text size="sm" c="dimmed">
              We ingest the Grants.gov catalogue, normalize key fields, and filter to the opportunities that match your onboarding defaults.
            </Text>
          </Stack>
          <Badge color="teal" radius="xl" variant="light">
            {prioritizedGrants.length} matches
          </Badge>
        </Group>
        <Grid gutter={{ base: 24, md: 40 }} align="start">
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              <FilterGroup title="States">
                <Chip.Group
                  multiple
                  value={filters.states}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      states: value
                    }))
                  }
                >
                  <ScrollArea h={180} type="auto" offsetScrollbars>
                    <Group gap="xs">
                      {states.map((state) => (
                        <Chip key={state} value={state} radius="xl" variant="light" color="midnight">
                          {state}
                        </Chip>
                      ))}
                    </Group>
                  </ScrollArea>
                </Chip.Group>
              </FilterGroup>
              <FilterGroup title="Focus areas">
                <Chip.Group
                  multiple
                  value={filters.focusAreas}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      focusAreas: value
                    }))
                  }
                >
                  <ScrollArea h={180} type="auto" offsetScrollbars>
                    <Group gap="xs">
                      {focusAreas.map((focus) => (
                        <Chip key={focus} value={focus} radius="xl" variant="light" color="blue">
                          {focus}
                        </Chip>
                      ))}
                    </Group>
                  </ScrollArea>
                </Chip.Group>
              </FilterGroup>
              <FilterGroup title="Due window">
                <Radio.Group
                  value={String(filters.dueWithinDays ?? "null")}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      dueWithinDays: value === "null" ? null : Number(value)
                    }))
                  }
                >
                  <Stack gap={6}>
                    {DUE_OPTIONS.map((option) => (
                      <Radio key={option.label} value={String(option.value)} label={option.label} />
                    ))}
                  </Stack>
                </Radio.Group>
              </FilterGroup>
              <FilterGroup title="Funding amount">
                <Radio.Group
                  value={`${filters.minAward ?? "null"}-${filters.maxAward ?? "null"}`}
                  onChange={(value) => {
                    const [min, max] = value.split("-");
                    setFilters((prev) => ({
                      ...prev,
                      minAward: min === "null" ? null : Number(min),
                      maxAward: max === "null" ? null : Number(max)
                    }));
                  }}
                >
                  <Stack gap={6}>
                    {AMOUNT_OPTIONS.map((option) => (
                      <Radio
                        key={option.label}
                        value={`${option.min ?? "null"}-${option.max ?? "null"}`}
                        label={option.label}
                      />
                    ))}
                  </Stack>
                </Radio.Group>
              </FilterGroup>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="md">
              {prioritizedGrants.length === 0 && (
                <Card withBorder radius="lg" padding="xl" variant="surfaceIndigo">
                  <Text size="sm" c="dimmed">
                    No grants match your filters yet. Try broadening your due date range or removing focus areas.
                  </Text>
                </Card>
              )}
              {prioritizedGrants.map((grant) => {
                const isSaved = savedGrantIds.has(grant.id);
                return (
                  <GrantCard
                    key={grant.id}
                    grant={grant}
                    isSaved={isSaved}
                    onToggle={() => toggleSaveGrant(grant)}
                  />
                );
              })}
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}

type FilterGroupProps = {
  title: string;
  children: React.ReactNode;
};

function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <Paper withBorder radius="lg" p="md" variant="surfaceDeep">
      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          {title}
        </Text>
        {children}
      </Stack>
    </Paper>
  );
}

type GrantCardProps = {
  grant: GrantOpportunity;
  isSaved: boolean;
  onToggle: () => void;
};

function GrantCard({ grant, isSaved, onToggle }: GrantCardProps) {
  const amount = grant.awardCeiling ?? grant.estimatedFunding ?? null;
  const dueLabel = formatDate(grant.closeDate);
  const focusAreas = grant.focusAreas.length > 0 ? grant.focusAreas : ["General"];

  return (
    <Paper withBorder radius="xl" p="lg" variant="surfacePrimary">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed">
              {grant.agency}
            </Text>
            <Title order={4} size="h4">
              {grant.title}
            </Title>
          </Stack>
          <Button variant={isSaved ? "light" : "outline"} color="teal" radius="xl" onClick={onToggle} size="sm">
            {isSaved ? "Saved" : "Save to pipeline"}
          </Button>
        </Group>
        <SimpleStats
          items={[
            { label: "Opportunity #", value: grant.opportunityNumber },
            { label: "Due", value: dueLabel },
            { label: "Award ceiling", value: formatCurrency(amount) },
            { label: "Focus areas", value: focusAreas.join(", ") }
          ]}
        />
        <Text size="sm" c="dimmed">
          {grant.summary}
        </Text>
        <Group gap="xs" wrap="wrap">
          <Button component="a" href={grant.url} target="_blank" rel="noreferrer" variant="default" size="xs">
            View on Grants.gov
          </Button>
          {grant.eligibilities.some((eligibility) => eligibility.states.length > 0) && (
            <Badge variant="light" color="midnight">
              Eligible states: {grant.eligibilities.flatMap((eligibility) => eligibility.states).join(", ")}
            </Badge>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

type SimpleStatsProps = {
  items: Array<{ label: string; value: string | number | null }>;
};

function SimpleStats({ items }: SimpleStatsProps) {
  return (
    <Grid>
      {items.map((item) => (
        <Grid.Col key={item.label} span={{ base: 12, sm: 6 }}>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase">
            {item.label}
          </Text>
          <Text fw={600}>{item.value ?? "—"}</Text>
        </Grid.Col>
      ))}
    </Grid>
  );
}

function countMatches(grant: GrantOpportunity, filters: FiltersState) {
  let score = 0;
  if (filters.states.length > 0) {
    const states = new Set(grant.eligibilities.flatMap((eligibility) => eligibility.states));
    for (const state of filters.states) {
      if (states.has(state)) score += 1;
    }
  }
  if (filters.focusAreas.length > 0) {
    const focus = grant.focusAreas.map((item) => item.toLowerCase());
    for (const item of filters.focusAreas) {
      if (focus.includes(item.toLowerCase())) score += 1;
    }
  }
  return score;
}
