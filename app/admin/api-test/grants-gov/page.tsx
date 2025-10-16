"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title
} from "@mantine/core";

const SORT_OPTIONS = [
  { value: "closeDate|desc", label: "Close date (desc)" },
  { value: "closeDate|asc", label: "Close date (asc)" },
  { value: "postedDate|desc", label: "Posted date (desc)" },
  { value: "postedDate|asc", label: "Posted date (asc)" }
];

const STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
];

const CATEGORIES = ["Arts", "Business and Commerce", "Community Development", "Education", "Environment", "Health", "Science and Technology"]; // truncated

const HISTORY_KEY = "admin-grants-gov-history";
const MAX_HISTORY = 20;

type ApiHistoryItem = {
  timestamp: string;
  params: Record<string, unknown>;
  status?: number;
};

type GrantsGovOpportunity = {
  opportunityNumber: string;
  title: string;
  agency: string;
  closeDate: string;
  postedDate: string;
  awardCeiling?: string;
  awardFloor?: string;
};

export default function GrantsGovTesterPage() {
  const [sortBy, setSortBy] = useState<string | null>(SORT_OPTIONS[0]?.value ?? null);
  const [startRecordNum, setStartRecordNum] = useState(0);
  const [numberOfRecords, setNumberOfRecords] = useState(50);
  const [keyword, setKeyword] = useState("");
  const [oppNum, setOppNum] = useState("");
  const [cfda, setCfda] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [headers, setHeaders] = useState("Accept: application/json");
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [results, setResults] = useState<GrantsGovOpportunity[]>([]);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [history, setHistory] = useState<ApiHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportedJsonUrl, setExportedJsonUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, MAX_HISTORY));
        }
      }
    } catch (error) {
      console.warn("Failed to load Grants.gov history", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch (error) {
      console.warn("Failed to persist Grants.gov history", error);
    }
  }, [history]);

  useEffect(() => {
    return () => {
      if (exportedJsonUrl) {
        URL.revokeObjectURL(exportedJsonUrl);
      }
    };
  }, [exportedJsonUrl]);

  const runRequest = async (overrideParams?: Partial<Record<string, unknown>>) => {
    setIsLoading(true);
    setError(null);
    setResponseJson(null);
    setResults([]);
    setStatusCode(null);
    setResponseTime(null);

    const payload = {
      sortBy,
      startRecordNum,
      numberOfRecords,
      keyword,
      oppNum,
      cfda,
      states,
      categories,
      headers,
      apiKey,
      ...(overrideParams ?? {})
    };

    const startedAt = performance.now();

    try {
      const response = await fetch("/api/admin/test-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const finishedAt = performance.now();
      setResponseTime(Math.round(finishedAt - startedAt));
      setStatusCode(response.status);

      const text = await response.text();
      setResponseJson(text);

      if (!response.ok) {
        setError("Request failed. Check the parameters and API availability.");
      } else {
        try {
          const parsed = JSON.parse(text ?? "{}");
          const opportunities: GrantsGovOpportunity[] = (parsed?.oppHits ?? []).map((item: any) => ({
            opportunityNumber: item?.opportunityNumber ?? "",
            title: item?.opportunityTitle ?? "",
            agency: item?.agency ?? "",
            closeDate: item?.closeDate ?? "",
            postedDate: item?.postedDate ?? "",
            awardCeiling: item?.awardCeiling,
            awardFloor: item?.awardFloor
          }));
          setResults(opportunities);
        } catch (parseError) {
          console.warn("Failed to parse Grants.gov response", parseError);
        }
      }

      setHistory((prev) => [{ timestamp: new Date().toISOString(), params: payload, status: response.status }, ...prev]);
    } catch (error) {
      console.error("Failed to call Grants.gov API", error);
      setError(error instanceof Error ? error.message : "Unexpected error while calling Grants.gov API");
    } finally {
      setIsLoading(false);
    }
  };

  const exportJson = () => {
    if (!responseJson) return;
    const blob = new Blob([responseJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExportedJsonUrl(url);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "grants-gov-response.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const quickTest = (preset: "basic" | "state" | "category" | "date" | "invalid") => {
    switch (preset) {
      case "basic":
        void runRequest({ numberOfRecords: 50, keyword: "STEM" });
        break;
      case "state":
        void runRequest({ states: ["PA"], numberOfRecords: 25 });
        break;
      case "category":
        void runRequest({ categories: ["Health"], numberOfRecords: 25 });
        break;
      case "date":
        void runRequest({ sortBy: "closeDate|asc", numberOfRecords: 50 });
        break;
      case "invalid":
        void runRequest({ numberOfRecords: 2000 });
        break;
    }
  };

  const parsedResponse = useMemo(() => {
    if (!responseJson) return null;
    try {
      return JSON.stringify(JSON.parse(responseJson), null, 2);
    } catch (error) {
      return responseJson;
    }
  }, [responseJson]);

  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          Grants.gov tester
        </Title>
        <Text size="sm" c="dimmed">
          Validate search filters, API keys, and payload handling using the Grants.gov REST API. Responses stream through the
          admin service to ensure they are captured in the audit log.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
        <Stack gap="md">
          <Group gap="md" wrap="wrap">
            <Select
              label="Sort by"
              data={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              comboboxProps={{ withinPortal: true }}
            />
            <NumberInput
              label="Start record"
              min={0}
              value={startRecordNum}
              onChange={(value) => setStartRecordNum(Number(value) || 0)}
            />
            <NumberInput
              label="Number of records"
              min={1}
              max={1000}
              value={numberOfRecords}
              onChange={(value) => setNumberOfRecords(Math.min(1000, Number(value) || 1))}
            />
          </Group>
          <Group gap="md" wrap="wrap">
            <TextInput label="Keyword" value={keyword} onChange={(event) => setKeyword(event.currentTarget.value)} />
            <TextInput label="Opportunity number" value={oppNum} onChange={(event) => setOppNum(event.currentTarget.value)} />
            <TextInput label="CFDA" value={cfda} onChange={(event) => setCfda(event.currentTarget.value)} />
          </Group>
          <Group gap="md" wrap="wrap">
            <MultiSelect
              label="States"
              data={STATES.map((value) => ({ value, label: value }))}
              value={states}
              onChange={setStates}
              searchable
              comboboxProps={{ withinPortal: true }}
            />
            <MultiSelect
              label="Categories"
              data={CATEGORIES.map((value) => ({ value, label: value }))}
              value={categories}
              onChange={setCategories}
              searchable
              comboboxProps={{ withinPortal: true }}
            />
          </Group>
          <TextInput label="API key" value={apiKey} onChange={(event) => setApiKey(event.currentTarget.value)} placeholder="Optional" />
          <Textarea
            label="Headers"
            description="One header per line"
            minRows={2}
            value={headers}
            onChange={(event) => setHeaders(event.currentTarget.value)}
          />
          <Group gap="sm" wrap="wrap">
            <Button loading={isLoading} onClick={() => runRequest()}>
              Send request
            </Button>
            <Button variant="light" onClick={exportJson} disabled={!responseJson}>
              Export JSON
            </Button>
            <Checkbox label="Log request" checked readOnly description="All requests are persisted to the audit log." />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" p="md" variant="surfaceSunken">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={4} size="h5">
              Response
            </Title>
            <Group gap="xs">
              {statusCode !== null && (
                <Badge color={statusCode >= 200 && statusCode < 300 ? "teal" : "red"}>HTTP {statusCode}</Badge>
              )}
              {responseTime !== null && <Badge color="gray">{responseTime} ms</Badge>}
            </Group>
          </Group>
          {error && (
            <Text size="sm" c="red.4">
              {error}
            </Text>
          )}
          <ScrollArea h={320} type="hover">
            <Box component="pre" style={{ whiteSpace: "pre-wrap" }}>
              {parsedResponse ?? "No response yet."}
            </Box>
          </ScrollArea>
        </Stack>
      </Paper>

      {results.length > 0 && (
        <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
          <Stack gap="md">
            <Title order={4} size="h5">
              Parsed opportunities
            </Title>
            <ScrollArea>
              <Table stickyHeader highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Opportunity #</Table.Th>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Agency</Table.Th>
                    <Table.Th>Close date</Table.Th>
                    <Table.Th>Posted date</Table.Th>
                    <Table.Th>Award range</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {results.map((row) => (
                    <Table.Tr key={row.opportunityNumber}>
                      <Table.Td>{row.opportunityNumber}</Table.Td>
                      <Table.Td>{row.title}</Table.Td>
                      <Table.Td>{row.agency}</Table.Td>
                      <Table.Td>{row.closeDate}</Table.Td>
                      <Table.Td>{row.postedDate}</Table.Td>
                      <Table.Td>
                        {row.awardFloor ?? "?"} – {row.awardCeiling ?? "?"}
                      </Table.Td>
                      <Table.Td>
                        <Anchor
                          href={`https://www.grants.gov/search-results-detail/${row.opportunityNumber}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View details
                        </Anchor>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </Paper>
      )}

      <Paper withBorder radius="lg" p="md" variant="surfaceSunken">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={5}>Quick tests</Title>
            <Group gap="xs">
              <Button size="xs" variant="light" onClick={() => quickTest("basic")}>
                Basic search
              </Button>
              <Button size="xs" variant="light" onClick={() => quickTest("state")}>
                State filter
              </Button>
              <Button size="xs" variant="light" onClick={() => quickTest("category")}>
                Category filter
              </Button>
              <Button size="xs" variant="light" onClick={() => quickTest("date")}>
                Closing soon
              </Button>
              <Button size="xs" variant="light" color="red" onClick={() => quickTest("invalid")}>
                Invalid request
              </Button>
            </Group>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" p="md" variant="surfaceSunken">
        <Stack gap="sm">
          <Title order={5}>Request history</Title>
          {history.length === 0 ? (
            <Text size="sm" c="dimmed">
              Requests are logged locally so you can rerun common scenarios quickly.
            </Text>
          ) : (
            <Stack gap="xs">
              {history.map((item, index) => (
                <Paper key={`${item.timestamp}-${index}`} withBorder radius="md" p="sm" variant="surfacePrimary">
                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">
                        {new Date(item.timestamp).toLocaleString()} • Status {item.status ?? "?"}
                      </Text>
                      <Button size="xs" variant="subtle" onClick={() => void runRequest(item.params)}>
                        Re-run
                      </Button>
                    </Group>
                    <Box component="pre" style={{ whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(item.params, null, 2)}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
