"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  FileInput,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title
} from "@mantine/core";

import {
  useGrantContext,
  type ManualGrantInput,
  type Priority,
  type Stage,
  type TaskStatus
} from "./grant-context";

type ParsedRow = {
  id: string;
  title: string;
  agency: string;
  opportunityNumber?: string;
  closeDate: string | null;
  owner?: string;
  notes?: string;
  priority?: string;
  stage?: string;
  focusAreas?: string[];
  tasks: {
    label: string;
    dueDate: string | null;
    assignee?: string;
    status?: string | null;
  }[];
};

const REQUIRED_COLUMNS = ["Grant Name", "Agency", "Deadline"];
const COLUMN_MAPPING = {
  title: "Grant Name",
  agency: "Agency",
  opportunityNumber: "Opportunity Number",
  closeDate: "Deadline",
  owner: "Owner Email",
  notes: "Notes",
  priority: "Priority",
  stage: "Stage",
  focusAreas: "Focus Areas"
} satisfies Record<string, string>;

const TASK_COLUMN_HINT = "Task";

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 1000;
const MAX_SHORT_FIELD_LENGTH = 200;
const MAX_LONG_FIELD_LENGTH = 2000;

const PRIORITY_VALUES: Priority[] = ["High", "Medium", "Low"];
const STAGE_VALUES: Stage[] = ["Researching", "Drafting", "Submitted", "Awarded", "Declined"];
const TASK_STATUS_VALUES: TaskStatus[] = ["pending", "completed"];

function normalizeHeader(header: string) {
  return header.trim();
}

function sanitizeCell(value: string, maxLength = MAX_LONG_FIELD_LENGTH) {
  return value.replace(CONTROL_CHAR_PATTERN, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeId(value: string) {
  return sanitizeCell(value, MAX_SHORT_FIELD_LENGTH);
}

function normalizePriority(value?: string | null): Priority | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return PRIORITY_VALUES.find((option) => option.toLowerCase() === normalized);
}

function normalizeStage(value?: string | null): Stage | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return STAGE_VALUES.find((option) => option.toLowerCase() === normalized);
}

function normalizeTaskStatus(value?: string | null): TaskStatus {
  if (!value) return "pending";
  const normalized = value.trim().toLowerCase();
  return TASK_STATUS_VALUES.find((option) => option.toLowerCase() === normalized) ?? "pending";
}

function parseDateCell(value: string, rowIndex: number, column: string, issues: string[]) {
  const sanitized = sanitizeCell(value, 64);
  if (!sanitized) return null;
  const parsed = new Date(sanitized);
  if (Number.isNaN(parsed.getTime())) {
    issues.push(`Row ${rowIndex}: Invalid ${column} date "${value}". Please use a recognizable date format.`);
    return null;
  }
  const year = parsed.getUTCFullYear();
  if (year < 1970 || year > 2100) {
    issues.push(`Row ${rowIndex}: ${column} date "${value}" must be between 1970 and 2100 to avoid scheduling errors.`);
    return null;
  }
  return parsed.toISOString();
}

function sanitizeOwnerEmail(value: string, rowIndex: number, issues: string[]) {
  const sanitized = sanitizeCell(value, 254);
  if (!sanitized) return undefined;
  if (!EMAIL_PATTERN.test(sanitized)) {
    issues.push(`Row ${rowIndex}: Owner email "${value}" is not a valid email address.`);
    return undefined;
  }
  return sanitized.toLowerCase();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;
  const pushValue = () => {
    current.push(value);
    value = "";
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      pushValue();
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      pushValue();
      if (current.length > 1 || current.some((cell) => cell.trim().length > 0)) {
        rows.push(current);
      }
      current = [];
    } else {
      value += char;
    }
  }
  pushValue();
  if (current.length > 1 || current.some((cell) => cell.trim().length > 0)) {
    rows.push(current);
  }
  return rows;
}

function buildTasks(
  headers: string[],
  row: Record<string, string>,
  rowIndex: number,
  issues: string[]
) {
  const taskBuckets = new Map<number, { label?: string; due?: string | null; owner?: string; status?: string | null }>();
  headers.forEach((header) => {
    if (!header.toLowerCase().startsWith(TASK_COLUMN_HINT.toLowerCase())) return;
    const normalized = header.trim();
    const match = normalized.match(/Task\s*(\d+)?\s*(Name|Due|Owner|Status)?/i);
    if (!match) return;
    const index = match[1] ? Number.parseInt(match[1], 10) : 1;
    const bucket = taskBuckets.get(index) ?? {};
    const field = match[2]?.toLowerCase();
    const value = row[header]?.trim();
    if (!value) {
      taskBuckets.set(index, bucket);
      return;
    }
    if (!field || field === "name") {
      bucket.label = sanitizeCell(value, MAX_SHORT_FIELD_LENGTH);
    } else if (field === "due") {
      bucket.due = parseDateCell(value, rowIndex, `task ${index} due`, issues);
    } else if (field === "owner") {
      bucket.owner = value;
    } else if (field === "status") {
      bucket.status = value;
    }
    taskBuckets.set(index, bucket);
  });

  const tasks: ParsedRow["tasks"] = [];
  for (const [index, bucket] of taskBuckets.entries()) {
    if (!bucket.label) continue;
    const dueDate = bucket.due ?? null;
    const ownerEmail = bucket.owner ? sanitizeOwnerEmail(bucket.owner, rowIndex, issues) : undefined;
    tasks.push({
      label: bucket.label,
      dueDate,
      assignee: ownerEmail,
      status: bucket.status ?? null
    });
  }
  return tasks;
}

function normalizeRow(
  headers: string[],
  values: string[],
  rowIndex: number,
  issues: string[]
): ParsedRow | null {
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });

  for (const column of REQUIRED_COLUMNS) {
    if (!row[column] || !row[column].trim()) {
      return null;
    }
  }

  const rawOpportunityNumber = row[COLUMN_MAPPING.opportunityNumber];
  const opportunityNumber = rawOpportunityNumber ? sanitizeId(rawOpportunityNumber) : undefined;
  const title = sanitizeCell(row[COLUMN_MAPPING.title], MAX_SHORT_FIELD_LENGTH);
  const agency = sanitizeCell(row[COLUMN_MAPPING.agency], MAX_SHORT_FIELD_LENGTH);
  if (!title || !agency) {
    issues.push(`Row ${rowIndex}: Missing required Grant Name or Agency after cleaning the data.`);
    return null;
  }
  const rawDeadline = row[COLUMN_MAPPING.closeDate] ?? "";
  const closeDate = parseDateCell(rawDeadline, rowIndex, "deadline", issues);
  if (rawDeadline.trim() && !closeDate) {
    return null;
  }
  const owner = sanitizeOwnerEmail(row[COLUMN_MAPPING.owner] ?? "", rowIndex, issues);
  const notes = sanitizeCell(row[COLUMN_MAPPING.notes] ?? "", MAX_LONG_FIELD_LENGTH) || undefined;
  const priority = sanitizeCell(row[COLUMN_MAPPING.priority] ?? "", MAX_SHORT_FIELD_LENGTH) || undefined;
  const stage = sanitizeCell(row[COLUMN_MAPPING.stage] ?? "", MAX_SHORT_FIELD_LENGTH) || undefined;
  const focusAreas = row[COLUMN_MAPPING.focusAreas]
    ? row[COLUMN_MAPPING.focusAreas]
        .split(/[,;]/)
        .map((item) => sanitizeCell(item, MAX_SHORT_FIELD_LENGTH))
        .filter(Boolean)
    : [];

  return {
    id: opportunityNumber || sanitizeId(title) || `row-${rowIndex}`,
    title,
    agency,
    opportunityNumber,
    closeDate,
    owner,
    notes,
    priority,
    stage,
    focusAreas,
    tasks: buildTasks(headers, row, rowIndex, issues)
  } satisfies ParsedRow;
}

export function CsvImporter() {
  const { bulkImportGrants } = useGrantContext();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: string[]; skipped: string[] } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const columnGuidance = useMemo(
    () => Object.entries(COLUMN_MAPPING).map(([key, header]) => ({ key, header })),
    []
  );

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Import grants from CSV</Title>
        <Text size="sm" c="dimmed">
          Upload your spreadsheet export and we&apos;ll map deadlines, owners, and checklist tasks into Grant Tracker.
        </Text>
      </Stack>
      <Paper withBorder radius="xl" p="xl" variant="surfacePrimary">
        <Stack gap="md">
          <Title order={4}>Column mapping</Title>
          <Text size="xs" c="dimmed">
            Use the headers below in your CSV to ensure we can align every field.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {columnGuidance.map((item) => (
              <Paper
                key={item.key}
                withBorder
                radius="lg"
                p="md"
                variant="surfaceSunken"
              >
                <Text size="xs" c="dimmed" tt="uppercase">
                  {item.key}
                </Text>
                <Text fw={600}>{item.header}</Text>
              </Paper>
            ))}
            <Paper withBorder radius="lg" p="md" variant="surfacePositiveTint">
              <Text size="xs" c="teal.2" tt="uppercase" fw={600}>
                Checklist tasks
              </Text>
              <Text size="sm" c="teal.1" mt={4}>
                Add columns like “Task 1”, “Task 1 Due”, and “Task 1 Owner” (repeat for additional tasks). We&apos;ll build
                checklists automatically.
              </Text>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Paper>
      <Paper withBorder radius="xl" p="xl" variant="surfacePrimary">
        <Stack gap="md">
          <FileInput
            label="Upload CSV file"
            placeholder="Select a .csv file"
            accept=".csv,text/csv"
            disabled={isParsing || isImporting}
            onChange={async (file) => {
              setErrors([]);
              setRows([]);
              setResult(null);
              if (!file) return;
              setIsParsing(true);
              try {
                const text = await file.text();
                const parsed = parseCsv(text);
                if (parsed.length === 0) {
                  setErrors(["We couldn’t find any data in that CSV."]);
                  return;
                }
                if (parsed.length - 1 > MAX_ROWS) {
                  setErrors([`This file contains ${parsed.length - 1} data rows. Please limit uploads to ${MAX_ROWS} rows at a time.`]);
                  return;
                }
                const headers = parsed[0].map(normalizeHeader);
                const missingRequired = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
                if (missingRequired.length > 0) {
                  setErrors([`Missing required columns: ${missingRequired.join(", ")}`]);
                  return;
                }
                const parsedRows: ParsedRow[] = [];
                const issues: string[] = [];
                for (let index = 1; index < parsed.length; index += 1) {
                  const values = parsed[index];
                  const rowNumber = index + 1;
                  const issueCount = issues.length;
                  const normalized = normalizeRow(headers, values, rowNumber, issues);
                  if (!normalized) {
                    if (issues.length === issueCount) {
                      issues.push(`Row ${rowNumber}: Missing required values.`);
                    }
                    continue;
                  }
                  parsedRows.push(normalized);
                }
                if (parsedRows.length === 0) {
                  issues.push("No valid rows found after validation.");
                }
                setErrors(issues);
                setRows(parsedRows);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setErrors([`Failed to read file: ${message}`]);
              } finally {
                setIsParsing(false);
              }
            }}
          />
          {isParsing && (
            <Text size="xs" c="dimmed">
              Parsing file…
            </Text>
          )}
          {rows.length > 0 && (
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  {rows.length} grants ready to import.
                </Text>
                <Button
                  size="sm"
                  loading={isImporting}
                  onClick={async () => {
                    if (isImporting) return;
                    setIsImporting(true);
                    try {
                      const payload: (ManualGrantInput & { id: string })[] = rows.map((row) => ({
                        id: row.id,
                        title: row.title,
                        agency: row.agency,
                        opportunityNumber: row.opportunityNumber,
                        closeDate: row.closeDate,
                        owner: row.owner,
                        notes: row.notes,
                        priority: normalizePriority(row.priority),
                        stage: normalizeStage(row.stage),
                        focusAreas: row.focusAreas,
                        tasks: row.tasks.map((task) => ({
                          label: task.label,
                          dueDate: task.dueDate,
                          assigneeEmail: task.assignee ?? null,
                          status: normalizeTaskStatus(task.status)
                        })),
                        source: "imported"
                      }));
                      const outcome = bulkImportGrants(payload);
                      setResult(outcome);
                    } catch (error) {
                      const message =
                        error instanceof Error ? error.message : "Unexpected error while importing grants.";
                      setErrors((prev) => [...prev, `Import failed: ${message}`]);
                    } finally {
                      setIsImporting(false);
                    }
                  }}
                >
                  Import to workspace
                </Button>
              </Group>
              <Table highlightOnHover withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Grant</Table.Th>
                    <Table.Th>Deadline</Table.Th>
                    <Table.Th>Owner</Table.Th>
                    <Table.Th>Tasks</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Text fw={600}>{row.title}</Text>
                        <Text size="xs" c="dimmed">
                          {row.agency}
                        </Text>
                      </Table.Td>
                      <Table.Td>{row.closeDate ? new Date(row.closeDate).toLocaleDateString() : "-"}</Table.Td>
                      <Table.Td>{row.owner ?? "Unassigned"}</Table.Td>
                      <Table.Td>
                        {row.tasks.length === 0
                          ? "No checklist items"
                          : row.tasks.map((task) => `${task.label}${task.assignee ? ` → ${task.assignee}` : ""}`).join(", ")}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          )}
          {errors.length > 0 && (
            <Alert color="red" variant="light" title="We found some issues" icon={<Badge color="red" radius="sm">!</Badge>}>
              <Stack gap={4}>
                {errors.map((error) => (
                  <Text key={error} size="xs">
                    • {error}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}
          {result && (
            <Alert color="teal" variant="light" title="Import complete">
              <Text size="sm">
                Added or updated {result.imported.length} grants.
                {result.skipped.length > 0 && ` Skipped ${result.skipped.length} duplicates or incomplete rows.`}
              </Text>
            </Alert>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
