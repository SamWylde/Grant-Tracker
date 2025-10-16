"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  Title,
  Tooltip
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { sql as sqlLanguage } from "@codemirror/lang-sql";
import {
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconClipboard,
  IconDatabaseExport,
  IconHistory,
  IconPlayerPlay,
  IconRefresh,
  IconStar,
  IconStarFilled,
  IconTrash
} from "@tabler/icons-react";
import Papa from "papaparse";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

type QueryResultState = {
  rows: Record<string, unknown>[];
  fields: string[];
  rowCount: number;
  executionTimeMs: number;
  notices: string[];
  truncated: boolean;
};

type QueryHistoryEntry = {
  id: string;
  sql: string;
  executedAt: string;
  rowCount?: number;
  readOnly: boolean;
  favorite?: boolean;
};

type ApiSuccessResponse = {
  result: QueryResultState;
  rateLimit?: { remaining: number; resetAt: number };
};

type ApiErrorResponse = {
  error: {
    message: string;
    code?: string;
    detail?: string | null;
    hint?: string | null;
  };
};

const HISTORY_STORAGE_KEY = "admin-sql-history";
const HISTORY_LIMIT = 50;

const DEFAULT_QUERY = "SELECT now() AS server_time;";

function createHistoryEntry(partial: Omit<QueryHistoryEntry, "id" | "executedAt">): QueryHistoryEntry {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return {
    id,
    executedAt: new Date().toISOString(),
    ...partial
  };
}

function formatExecutionTime(ms: number) {
  return `${ms.toFixed(1)} ms`;
}

function getHistoryFromStorage(): QueryHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueryHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse stored query history", error);
    return [];
  }
}

function saveHistoryToStorage(entries: QueryHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  } catch (error) {
    console.error("Failed to persist SQL history", error);
  }
}

function truncateQuery(sql: string, length = 80) {
  const value = sql.replace(/\s+/g, " ").trim();
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function isWriteOperation(sql: string): boolean {
  const cleaned = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim()
    .toLowerCase();
  if (!cleaned) return false;
  const writeRegex = /(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke)\b/;
  return writeRegex.test(cleaned);
}

function applySelectLimit(sql: string, limit: number) {
  const trimmed = sql.trim();
  if (!trimmed) return sql;
  const normalized = trimmed.toLowerCase();
  const isSelect = normalized.startsWith("select") || normalized.startsWith("with");
  if (!isSelect) {
    return sql;
  }
  const hasLimit = /limit\s+\d+/i.test(normalized);
  if (hasLimit) {
    return sql;
  }
  const sanitized = trimmed.endsWith(";") ? trimmed.slice(0, -1) : trimmed;
  return `${sanitized}\nLIMIT ${limit};`;
}

type SortState = {
  column: string | null;
  direction: "asc" | "desc";
};

type PendingExecution = {
  query: string;
  modifiedQuery: string;
};

export default function SqlWorkbenchPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [readOnly, setReadOnly] = useState(true);
  const [wrapTransaction, setWrapTransaction] = useState(false);
  const [autoLimitEnabled, setAutoLimitEnabled] = useState(true);
  const [rowLimit, setRowLimit] = useState<number>(1000);
  const [result, setResult] = useState<QueryResultState | null>(null);
  const [error, setError] = useState<ApiErrorResponse["error"] | null>(null);
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [rateLimit, setRateLimit] = useState<ApiSuccessResponse["rateLimit"] | null>(null);
  const [confirmWriteModalOpen, setConfirmWriteModalOpen] = useState(false);
  const pendingExecution = useRef<PendingExecution | null>(null);

  useEffect(() => {
    setHistory(getHistoryFromStorage());
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      saveHistoryToStorage(history);
    }
  }, [history]);

  const columns = useMemo(() => {
    if (!result) return [] as string[];
    if (result.fields.length > 0) return result.fields;
    if (result.rows.length === 0) return [];
    return Object.keys(result.rows[0] ?? {});
  }, [result]);

  const sortedRows = useMemo(() => {
    if (!result) return [] as Record<string, unknown>[];
    if (!sort.column) return result.rows;

    const rowsCopy = [...result.rows];
    rowsCopy.sort((a, b) => {
      const valueA = a[sort.column as keyof typeof a];
      const valueB = b[sort.column as keyof typeof b];

      if (valueA === valueB) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      if (typeof valueA === "number" && typeof valueB === "number") {
        return sort.direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      const stringA = String(valueA);
      const stringB = String(valueB);
      return sort.direction === "asc"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });

    return rowsCopy;
  }, [result, sort]);

  const pagedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, page, pageSize]);

  const totalPages = result ? Math.max(1, Math.ceil(result.rows.length / pageSize)) : 1;

  const handleSort = useCallback(
    (column: string) => {
      setSort((current) => {
        if (current.column === column) {
          return { column, direction: current.direction === "asc" ? "desc" : "asc" };
        }
        return { column, direction: "asc" };
      });
    },
    []
  );

  const runQuery = useCallback(
    async (originalQuery: string, finalQuery: string) => {
      setExecuting(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sql: finalQuery,
            readOnlyMode: readOnly,
            wrapTransaction,
            rowLimit: autoLimitEnabled ? rowLimit : null
          })
        });

        const payload = (await response.json()) as ApiSuccessResponse | ApiErrorResponse;

        if (!response.ok) {
          const errorResponse = payload as ApiErrorResponse;
          setError(errorResponse.error);
          notifications.show({
            title: "Query failed",
            message: errorResponse.error.message,
            color: "red"
          });
          return;
        }

        const success = payload as ApiSuccessResponse;
        setResult(success.result);
        setRateLimit(success.rateLimit ?? null);
        setPage(1);
        notifications.show({
          title: "Query executed",
          message: `Returned ${success.result.rowCount} rows in ${formatExecutionTime(success.result.executionTimeMs)}`,
          color: "teal"
        });
        setHistory((entries) => {
          const nextEntries = [
            createHistoryEntry({ sql: originalQuery, rowCount: success.result.rowCount, readOnly }),
            ...entries
          ];
          return nextEntries.slice(0, HISTORY_LIMIT);
        });
      } catch (error) {
        console.error("Failed to execute SQL query", error);
        setError({
          message: error instanceof Error ? error.message : "Failed to execute SQL query"
        });
        notifications.show({
          title: "Unexpected error",
          message: "We were unable to reach the admin API. Check network connectivity and try again.",
          color: "red"
        });
      } finally {
        setExecuting(false);
        pendingExecution.current = null;
      }
    },
    [readOnly, wrapTransaction, autoLimitEnabled, rowLimit]
  );

  const executeQuery = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      notifications.show({
        title: "SQL query required",
        message: "Enter a SQL statement before executing.",
        color: "yellow"
      });
      return;
    }

    const finalQuery = autoLimitEnabled ? applySelectLimit(trimmed, rowLimit) : trimmed;

    if (!readOnly && isWriteOperation(trimmed)) {
      pendingExecution.current = { query: trimmed, modifiedQuery: finalQuery };
      setConfirmWriteModalOpen(true);
      return;
    }

    runQuery(trimmed, finalQuery);
  }, [query, readOnly, autoLimitEnabled, rowLimit, runQuery]);

  const confirmWriteOperation = useCallback(() => {
    if (!pendingExecution.current) return;
    const { query: originalQuery, modifiedQuery } = pendingExecution.current;
    setConfirmWriteModalOpen(false);
    runQuery(originalQuery, modifiedQuery);
  }, [runQuery]);

  const cancelWriteOperation = useCallback(() => {
    pendingExecution.current = null;
    setConfirmWriteModalOpen(false);
  }, []);

  const loadHistoryEntry = useCallback((entry: QueryHistoryEntry) => {
    setQuery(entry.sql);
    setReadOnly(entry.readOnly);
  }, []);

  const toggleFavorite = useCallback((entryId: string) => {
    setHistory((entries) =>
      entries.map((entry) => (entry.id === entryId ? { ...entry, favorite: !entry.favorite } : entry))
    );
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  }, []);

  const copyResults = useCallback(() => {
    if (!result) return;
    const payload = JSON.stringify(result.rows, null, 2);
    navigator.clipboard
      .writeText(payload)
      .then(() => {
        notifications.show({
          title: "Copied results",
          message: "Query results copied to clipboard as JSON.",
          color: "teal"
        });
      })
      .catch((error) => {
        console.error("Failed to copy query results", error);
        notifications.show({
          title: "Copy failed",
          message: "We were unable to copy the results. Please try again.",
          color: "red"
        });
      });
  }, [result]);

  const exportCsv = useCallback(() => {
    if (!result) return;
    const csv = Papa.unparse(result.rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `query-results-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, result]);

  return (
    <Stack gap="lg" p="md">
      <Stack gap={4}>
        <Title order={2}>SQL workbench</Title>
        <Text size="sm" c="dimmed">
          Run ad-hoc queries against the primary Postgres database. Queries execute with the service role and are fully audited.
        </Text>
      </Stack>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <CodeMirror
            value={query}
            height="200px"
            extensions={[sqlLanguage()]}
            theme="dark"
            onChange={(value) => setQuery(value)}
          />
          <Group justify="space-between" align="flex-end" wrap="wrap">
            <Group gap="sm">
              <Button
                leftSection={<IconPlayerPlay size={16} />}
                onClick={executeQuery}
                loading={executing}
                disabled={executing}
                color="midnight"
              >
                Execute
              </Button>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => setQuery("")}
                disabled={executing}
              >
                Clear
              </Button>
            </Group>
            <Group gap="lg">
              <Switch
                label="Read-only mode"
                checked={readOnly}
                onChange={(event) => setReadOnly(event.currentTarget.checked)}
              />
              <Switch
                label="Wrap in transaction"
                checked={wrapTransaction}
                onChange={(event) => setWrapTransaction(event.currentTarget.checked)}
              />
              <Group gap="xs">
                <Switch
                  label="Auto LIMIT"
                  checked={autoLimitEnabled}
                  onChange={(event) => setAutoLimitEnabled(event.currentTarget.checked)}
                />
                <NumberInput
                  label="Row limit"
                  value={rowLimit}
                  onChange={(value) => setRowLimit(Number(value) || 0)}
                  min={100}
                  max={5000}
                  step={100}
                  clampBehavior="strict"
                  disabled={!autoLimitEnabled}
                  style={{ width: 140 }}
                />
              </Group>
            </Group>
          </Group>
        </Stack>
      </Card>

      {error ? (
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Query error" variant="light">
          <Stack gap={4}>
            <Text size="sm">{error.message}</Text>
            {error.detail ? (
              <Text size="xs" c="dimmed">
                Detail: {error.detail}
              </Text>
            ) : null}
            {error.hint ? (
              <Text size="xs" c="dimmed">
                Hint: {error.hint}
              </Text>
            ) : null}
          </Stack>
        </Alert>
      ) : null}

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Stack gap={2}>
              <Group gap="sm">
                <Title order={4}>Results</Title>
                {result ? <Badge color="midnight">{result.rowCount} rows</Badge> : null}
              </Group>
              {result ? (
                <Text size="xs" c="dimmed">
                  {`Completed in ${formatExecutionTime(result.executionTimeMs)}`}
                </Text>
              ) : (
                <Text size="xs" c="dimmed">
                  Run a query to view tabular results.
                </Text>
              )}
            </Stack>
            <Group gap="sm">
              <Tooltip label="Copy JSON results" disabled={!result}>
                <ActionIcon variant="light" color="midnight" onClick={copyResults} disabled={!result}>
                  <IconClipboard size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Export CSV" disabled={!result}>
                <ActionIcon variant="light" color="midnight" onClick={exportCsv} disabled={!result}>
                  <IconDatabaseExport size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {rateLimit ? (
            <Text size="xs" c="dimmed">
              {`Rate limit: ${rateLimit.remaining} executions remaining. Resets ${new Date(rateLimit.resetAt).toLocaleTimeString()}.`}
            </Text>
          ) : null}

          {result?.notices?.length ? (
            <Stack gap={4}>
              {result.notices.map((notice) => (
                <Alert key={notice} color="yellow" icon={<IconAlertCircle size={16} />} variant="light">
                  <Text size="xs">{notice}</Text>
                </Alert>
              ))}
            </Stack>
          ) : null}

          {result ? (
            <Stack gap="sm">
              <ScrollArea>
                <Table highlightOnHover stickyHeader horizontalSpacing="sm" verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      {columns.map((column) => {
                        const isSorted = sort.column === column;
                        const Icon = isSorted && sort.direction === "asc" ? IconArrowUp : IconArrowDown;
                        return (
                          <Table.Th key={column} onClick={() => handleSort(column)} style={{ cursor: "pointer" }}>
                            <Group gap={4}>
                              <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                                {column}
                              </Text>
                              {isSorted ? <Icon size={14} /> : null}
                            </Group>
                          </Table.Th>
                        );
                      })}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pagedRows.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={columns.length || 1}>
                          <Text size="sm" c="dimmed">
                            No rows returned.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      pagedRows.map((row, rowIndex) => (
                        <Table.Tr key={`${page}-${rowIndex}`}>
                          {columns.map((column) => (
                            <Table.Td key={column}>
                              <Text size="sm">
                                {row[column as keyof typeof row] != null ? String(row[column as keyof typeof row]) : "NULL"}
                              </Text>
                            </Table.Td>
                          ))}
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
              <Group justify="space-between" align="center">
                <Pagination value={page} onChange={setPage} total={totalPages} color="midnight" size="sm" />
                <NumberInput
                  label="Rows per page"
                  value={pageSize}
                  min={25}
                  max={500}
                  step={25}
                  onChange={(value) => setPageSize(Number(value) || 25)}
                  clampBehavior="strict"
                  style={{ width: 160 }}
                />
              </Group>
            </Stack>
          ) : (
            <Paper withBorder p="lg" radius="md" variant="surface">
              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  Awaiting query execution
                </Text>
                <Text size="sm" c="dimmed">
                  Use the editor above to compose a statement and click Execute. Results and metadata will appear here.
                </Text>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <IconHistory size={16} />
              <Title order={5}>Query history</Title>
            </Group>
            <Button leftSection={<IconTrash size={14} />} variant="light" color="red" size="xs" onClick={clearHistory}>
              Clear history
            </Button>
          </Group>
          {history.length === 0 ? (
            <Text size="sm" c="dimmed">
              Execute queries to populate your personal history (stored locally in this browser).
            </Text>
          ) : (
            <Stack gap="xs">
              {history.map((entry) => (
                <Card withBorder key={entry.id} radius="md" padding="sm">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box style={{ flex: 1 }}>
                      <Button
                        variant="subtle"
                        color="midnight"
                        size="xs"
                        onClick={() => loadHistoryEntry(entry)}
                      >
                        {truncateQuery(entry.sql)}
                      </Button>
                      <Text size="xs" c="dimmed">
                        {new Date(entry.executedAt).toLocaleString()} · {entry.readOnly ? "Read-only" : "Write"}
                        {typeof entry.rowCount === "number" ? ` · ${entry.rowCount} rows` : ""}
                      </Text>
                    </Box>
                    <Group gap="xs" align="center">
                      <Tooltip label={entry.favorite ? "Remove favorite" : "Save to favorites"}>
                        <ActionIcon variant="subtle" color="yellow" onClick={() => toggleFavorite(entry.id)}>
                          {entry.favorite ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      <Modal opened={confirmWriteModalOpen} onClose={cancelWriteOperation} title="Confirm write operation" centered>
        <Stack gap="md">
          <Text size="sm">
            You are about to execute a query that modifies data. This action cannot be undone. Confirm you wish to run the
            following statement.
          </Text>
          <Textarea minRows={6} value={pendingExecution.current?.query ?? ""} readOnly autosize />
          <Group justify="flex-end">
            <Button variant="light" onClick={cancelWriteOperation}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmWriteOperation} leftSection={<IconPlayerPlay size={14} />}>
              Run query
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
