"use client";

import { useMemo, useState } from "react";

import { useGrantContext } from "./grant-context";

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

function normalizeHeader(header: string) {
  return header.trim();
}

function sanitizeCell(value: string, maxLength = MAX_LONG_FIELD_LENGTH) {
  return value.replace(CONTROL_CHAR_PATTERN, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeId(value: string) {
  return sanitizeCell(value, MAX_SHORT_FIELD_LENGTH);
}

function parseDateCell(value: string, rowIndex: number, column: string, issues: string[]) {
  const sanitized = sanitizeCell(value, 64);
  if (!sanitized) return null;
  const parsed = new Date(sanitized);
  if (Number.isNaN(parsed.getTime())) {
    issues.push(`Row ${rowIndex}: Invalid ${column} date "${value}". Please use a recognizable date format.`);
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
  const taskBuckets = new Map<
    number,
    { label?: string; due?: string | null; owner?: string }
  >();
  headers.forEach((header) => {
    if (!header.toLowerCase().startsWith(TASK_COLUMN_HINT.toLowerCase())) return;
    const normalized = header.trim();
    const match = normalized.match(/Task\s*(\d+)?\s*(Name|Due|Owner)?/i);
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
    }
    taskBuckets.set(index, bucket);
  });

  const tasks: ParsedRow["tasks"] = [];
  for (const [index, bucket] of taskBuckets.entries()) {
    if (!bucket.label) continue;
    const dueDate = bucket.due ?? null;
    const ownerEmail = bucket.owner
      ? sanitizeOwnerEmail(bucket.owner, rowIndex, issues)
      : undefined;
    tasks.push({
      label: bucket.label,
      dueDate,
      assignee: ownerEmail
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
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Import grants from CSV</h1>
        <p className="text-sm text-slate-300">
          Upload your spreadsheet export and we&apos;ll map deadlines, owners, and checklist tasks into Grant Tracker.
        </p>
      </header>
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-200">
        <h2 className="text-base font-semibold text-white">Column mapping</h2>
        <p className="mt-2 text-xs text-slate-400">
          Use the headers below in your CSV to ensure we can align every field.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {columnGuidance.map((item) => (
            <li key={item.key} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.key}</p>
              <p className="mt-1 font-semibold text-white">{item.header}</p>
            </li>
          ))}
          <li className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-200">Checklist tasks</p>
            <p className="mt-1 text-sm text-emerald-100">
              Add columns like “Task 1”, “Task 1 Due”, and “Task 1 Owner” (repeat for additional tasks). We&apos;ll build
              checklists automatically.
            </p>
          </li>
        </ul>
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-200">
        <label className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-white">Upload CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (event) => {
              const file = event.target.files?.[0];
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
                  setErrors([
                    `This file contains ${parsed.length - 1} data rows. Please limit uploads to ${MAX_ROWS} rows at a time.`
                  ]);
                  return;
                }
                const headers = parsed[0].map(normalizeHeader);
                const missingRequired = REQUIRED_COLUMNS.filter(
                  (column) => !headers.includes(column)
                );
                if (missingRequired.length > 0) {
                  setErrors([
                    `Missing required columns: ${missingRequired.join(", ")}`
                  ]);
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
                event.target.value = "";
              }
            }}
            className="rounded-lg border border-dashed border-white/20 bg-slate-950/60 px-4 py-3 text-sm text-white"
            disabled={isParsing || isImporting}
          />
        </label>
        {isParsing && (
          <p className="mt-2 text-xs text-slate-400">Parsing file…</p>
        )}
        {rows.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">{rows.length} grants ready to import.</p>
              <button
                type="button"
                onClick={async () => {
                  if (isImporting) return;
                  setIsImporting(true);
                  try {
                    const payload = rows.map((row) => ({
                      id: row.id,
                      title: row.title,
                      agency: row.agency,
                      opportunityNumber: row.opportunityNumber,
                      closeDate: row.closeDate,
                      owner: row.owner,
                      notes: row.notes,
                      priority: row.priority as any,
                      stage: row.stage as any,
                      focusAreas: row.focusAreas,
                      tasks: row.tasks.map((task) => ({
                        label: task.label,
                        dueDate: task.dueDate,
                        assigneeEmail: task.assignee ?? null,
                        status: "pending"
                      })),
                      source: "imported"
                    }));
                    const outcome = bulkImportGrants(payload);
                    setResult(outcome);
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "Unexpected error while importing grants.";
                    setErrors((prev) => [...prev, `Import failed: ${message}`]);
                  } finally {
                    setIsImporting(false);
                  }
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isImporting
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 hover:text-white"
                }`}
                disabled={isImporting || rows.length === 0}
                aria-busy={isImporting}
              >
                {isImporting ? "Importing…" : "Import to workspace"}
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-white/5 uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="px-3 py-2">Grant</th>
                    <th className="px-3 py-2">Deadline</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-200">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-white">{row.title}</p>
                        <p className="text-xs text-slate-400">{row.agency}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {row.closeDate ? new Date(row.closeDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-300">{row.owner ?? "Unassigned"}</td>
                      <td className="px-3 py-2 text-xs text-slate-300">
                        {row.tasks.length === 0
                          ? "No checklist items"
                          : row.tasks
                              .map((task) => `${task.label}${task.assignee ? ` → ${task.assignee}` : ""}`)
                              .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {errors.length > 0 && (
          <div className="mt-4 space-y-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-xs text-rose-100">
            <p className="font-semibold">We found some issues:</p>
            <ul className="list-disc space-y-1 pl-4">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {result && (
          <div className="mt-4 space-y-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-xs text-emerald-100">
            <p className="font-semibold">Import complete</p>
            <p>
              Added or updated {result.imported.length} grants.
              {result.skipped.length > 0 && ` Skipped ${result.skipped.length} duplicates or incomplete rows.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
