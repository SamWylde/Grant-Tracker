"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip
} from "@mantine/core";
import { IconHistory, IconPlayerPlay, IconRefresh, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import Papa from "papaparse";

const HISTORY_KEY = "admin-sql-history";
const FAVORITES_KEY = "admin-sql-favorites";
const MAX_HISTORY = 50;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

type QueryHistoryItem = {
  query: string;
  timestamp: string;
  label?: string;
};

type QueryResult = {
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: string[];
  executionTimeMs: number;
  isSelect: boolean;
};

function loadHistory(key: string): QueryHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item?.query === "string" && typeof item?.timestamp === "string");
    }
  } catch (error) {
    console.warn("Failed to parse admin SQL history", error);
  }
  return [];
}

function persistHistory(key: string, items: QueryHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch (error) {
    console.warn("Failed to persist admin SQL history", error);
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return date.toLocaleString();
}

export default function AdminSqlPage() {
  const [query, setQuery] = useState("SELECT * FROM orgs LIMIT 50;");
  const [readOnly, setReadOnly] = useState(true);
  const [wrapInTransaction, setWrapInTransaction] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<QueryHistoryItem[]>([]);
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [favoriteLabel, setFavoriteLabel] = useState("");
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  useEffect(() => {
    setHistory(loadHistory(HISTORY_KEY));
    setFavorites(loadHistory(FAVORITES_KEY));
  }, []);

  useEffect(() => {
    persistHistory(HISTORY_KEY, history);
  }, [history]);

  useEffect(() => {
    persistHistory(FAVORITES_KEY, favorites);
  }, [favorites]);

  const rowsForPage = useMemo(() => {
    if (!result) return [];
    const start = page * pageSize;
    return result.rows.slice(start, start + pageSize);
  }, [page, pageSize, result]);

  const totalPages = useMemo(() => {
    if (!result) return 0;
    return Math.max(1, Math.ceil(result.rows.length / pageSize));
  }, [pageSize, result]);

  useEffect(() => {
    setPage(0);
  }, [result, pageSize]);

  const runQuery = async (confirmed = false) => {
    if (!query.trim()) {
      setError("Enter a SQL query to execute.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          readOnly,
          wrapInTransaction,
          confirmDangerous: confirmed
        })
      });

      if (response.status === 412) {
        setPendingConfirmation(query);
        return;
      }

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Unable to execute query.");
        return;
      }

      setResult(payload as QueryResult);
      setHistory((prev) => [{ query, timestamp: new Date().toISOString() }, ...prev].slice(0, MAX_HISTORY));
    } catch (error) {
      console.error("Failed to execute admin SQL query", error);
      setError(error instanceof Error ? error.message : "Unexpected error while executing query.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const csv = Papa.unparse(result.rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-query-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyResults = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2));
    } catch (error) {
      console.error("Failed to copy query results", error);
    }
  };

  const saveFavorite = () => {
    if (!query.trim()) return;
    const label = favoriteLabel.trim() || `Saved query ${favorites.length + 1}`;
    setFavorites((prev) => [{ query, timestamp: new Date().toISOString(), label }, ...prev].slice(0, MAX_HISTORY));
    setFavoriteLabel("");
    setIsSavingFavorite(false);
  };

  const applyHistoryQuery = (item: QueryHistoryItem) => {
    setQuery(item.query);
  };

  return (
    <Stack gap="xl">
      <Stack gap={8}>
        <Title order={2} c="gray.0">
          SQL workbench
        </Title>
        <Text size="sm" c="dimmed">
          Run ad-hoc queries using the service role connection. Read-only mode is enabled by default and all execution details
          are logged to the admin audit trail.
        </Text>
      </Stack>

      <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
        <Stack gap="md">
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Stack gap={4} style={{ flex: 1, minWidth: "min(100%, 520px)" }}>
              <Text size="xs" fw={600} c="gray.5" tt="uppercase">
                SQL query
              </Text>
              <Box
                style={{
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  border: "1px solid rgba(148, 163, 184, 0.24)",
                  background: "rgba(15, 23, 42, 0.6)"
                }}
              >
                <CodeMirror value={query} onChange={setQuery} height="240px" extensions={[sql()]} theme="dark" />
              </Box>
            </Stack>
            <Stack gap="xs" style={{ width: 220 }}>
              <Checkbox label="Read-only mode" checked={readOnly} onChange={(event) => setReadOnly(event.currentTarget.checked)} />
              <Checkbox
                label="Wrap in transaction"
                checked={wrapInTransaction}
                onChange={(event) => setWrapInTransaction(event.currentTarget.checked)}
              />
              <Button leftSection={<IconPlayerPlay size={16} />} loading={isLoading} onClick={() => runQuery()}>
                Execute query
              </Button>
              <Button variant="light" color="gray" leftSection={<IconRefresh size={16} />} onClick={() => setResult(null)}>
                Clear results
              </Button>
              <Button variant="light" leftSection={<IconUpload size={16} />} onClick={() => setIsSavingFavorite(true)}>
                Save favorite
              </Button>
            </Stack>
          </Group>
          {error && (
            <Text size="sm" c="red.4">
              {error}
            </Text>
          )}
        </Stack>
      </Paper>

      {result && (
        <Paper withBorder radius="lg" p="md" variant="surfacePrimary">
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Stack gap={4}>
                <Title order={4} size="h5">
                  Results
                </Title>
                <Text size="xs" c="dimmed">
                  {result.rowCount} rows • {result.executionTimeMs} ms
                </Text>
              </Stack>
              <Group gap="sm" wrap="wrap">
                <Button variant="light" onClick={exportCsv}>
                  Export CSV
                </Button>
                <Button variant="light" onClick={copyResults}>
                  Copy JSON
                </Button>
                <Select
                  label="Rows per page"
                  data={PAGE_SIZE_OPTIONS.map((value) => ({ value: String(value), label: `${value}` }))}
                  value={String(pageSize)}
                  onChange={(value) => value && setPageSize(Number(value))}
                  size="xs"
                />
                <Group gap={4}>
                  <Button
                    size="xs"
                    variant="subtle"
                    disabled={page <= 0}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  >
                    Prev
                  </Button>
                  <Text size="xs" c="dimmed">
                    Page {page + 1} of {totalPages}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  >
                    Next
                  </Button>
                </Group>
              </Group>
            </Group>

            <ScrollArea>
              <Table highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    {result.columns.map((column) => (
                      <Table.Th key={column}>{column}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rowsForPage.map((row, rowIndex) => (
                    <Table.Tr key={rowIndex}>
                      {result.columns.map((column) => (
                        <Table.Td key={column}>
                          {typeof row[column] === "object"
                            ? JSON.stringify(row[column])
                            : String(row[column] ?? "")}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper withBorder radius="lg" p="md" variant="surfaceSunken">
          <Stack gap="sm">
            <Group gap="xs">
              <IconHistory size={16} />
              <Title order={5}>Query history</Title>
            </Group>
            {history.length === 0 ? (
              <Text size="sm" c="dimmed">
                No queries yet. Run a statement to populate the history list.
              </Text>
            ) : (
              <Stack gap="xs">
                {history.map((item) => (
                  <Paper
                    key={`${item.timestamp}-${item.query.slice(0, 24)}`}
                    withBorder
                    radius="md"
                    p="sm"
                    variant="surfacePrimary"
                  >
                    <Stack gap={4}>
                      <Group justify="space-between" align="flex-start">
                        <Text size="xs" c="dimmed">
                          {formatTimestamp(item.timestamp)}
                        </Text>
                        <Button size="xs" variant="subtle" onClick={() => applyHistoryQuery(item)}>
                          Load
                        </Button>
                      </Group>
                      <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
                        {item.query}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper withBorder radius="lg" p="md" variant="surfaceSunken">
          <Stack gap="sm">
            <Group gap="xs" align="center">
              <Badge color="violet" variant="light">
                Favorites
              </Badge>
              <Title order={5}>Saved queries</Title>
            </Group>
            {favorites.length === 0 ? (
              <Text size="sm" c="dimmed">
                Save frequently used statements for quick access.
              </Text>
            ) : (
              <Stack gap="xs">
                {favorites.map((item) => (
                  <Paper
                    key={`${item.timestamp}-${item.query.slice(0, 24)}`}
                    withBorder
                    radius="md"
                    p="sm"
                    variant="surfacePrimary"
                  >
                    <Stack gap={4}>
                      <Group justify="space-between" align="center">
                        <Text size="sm" fw={600}>
                          {item.label ?? "Favorite query"}
                        </Text>
                        <Group gap={4}>
                          <Tooltip label="Load query">
                            <ActionIcon variant="light" size="sm" onClick={() => applyHistoryQuery(item)}>
                              <IconPlayerPlay size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Remove from favorites">
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color="red"
                              onClick={() =>
                                setFavorites((prev) =>
                                  prev.filter((candidate) => !(candidate.query === item.query && candidate.timestamp === item.timestamp))
                                )
                              }
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {formatTimestamp(item.timestamp)}
                      </Text>
                      <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
                        {item.query}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>

      <Modal opened={Boolean(pendingConfirmation)} onClose={() => setPendingConfirmation(null)} title="Confirm write query" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            You are about to execute a write or DDL statement. Double check the SQL below before continuing.
          </Text>
          <Paper withBorder radius="md" p="sm" variant="surfacePrimary" style={{ maxHeight: 280, overflow: "auto" }}>
            <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
              {pendingConfirmation}
            </Text>
          </Paper>
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setPendingConfirmation(null)} leftSection={<IconX size={16} />}>
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={() => {
                const statement = pendingConfirmation;
                setPendingConfirmation(null);
                if (statement) {
                  void runQuery(true);
                }
              }}
            >
              Run query
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={isSavingFavorite} onClose={() => setIsSavingFavorite(false)} title="Save query" centered>
        <Stack gap="md">
          <TextInput
            label="Query name"
            placeholder="Monthly grant summary"
            value={favoriteLabel}
            onChange={(event) => setFavoriteLabel(event.currentTarget.value)}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={() => setIsSavingFavorite(false)}>
              Cancel
            </Button>
            <Button onClick={saveFavorite}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
