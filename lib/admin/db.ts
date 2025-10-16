import { performance } from "node:perf_hooks";

import type { QueryResult } from "pg";
import { Pool } from "pg";

export type SqlExecutionResult = {
  rows: Record<string, unknown>[];
  fields: string[];
  rowCount: number;
  executionTimeMs: number;
  notices: string[];
  truncated: boolean;
};

export type SqlExecutionOptions = {
  sql: string;
  wrapTransaction?: boolean;
  enforceReadOnly?: boolean;
  rowLimit?: number | null;
};

export type SqlExecutionError = {
  message: string;
  code?: string;
  detail?: string | null;
  hint?: string | null;
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (pool) return pool;

  const connectionString =
    process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_DB_CONNECTION ?? null;

  if (!connectionString) {
    return null;
  }

  pool = new Pool({
    connectionString,
    max: 5,
    ssl:
      connectionString.includes("supabase.co") || connectionString.includes("supabase.red")
        ? { rejectUnauthorized: false }
        : undefined
  });

  return pool;
}

function detectDangerousStatements(sql: string): string[] {
  const normalized = sql.toLowerCase();
  const warnings: string[] = [];
  const dangerousKeywords = ["drop ", "truncate ", "alter ", "grant ", "revoke ", "delete ", "update ", "insert "];

  for (const keyword of dangerousKeywords) {
    if (normalized.includes(keyword)) {
      warnings.push(`Query contains potentially destructive keyword: ${keyword.trim().toUpperCase()}`);
    }
  }

  return warnings;
}

function isReadOnlyQuery(sql: string): boolean {
  const cleaned = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim()
    .toLowerCase();

  if (!cleaned) return true;

  if (cleaned.startsWith("select") || cleaned.startsWith("with")) {
    const writeKeywords = /(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke)\b/;
    return !writeKeywords.test(cleaned);
  }

  return false;
}

function buildMockResult(sql: string): SqlExecutionResult {
  const sampleRows = [
    { id: 1, note: "Admin panel is running in demo mode" },
    { id: 2, note: "Provide DATABASE_URL or SUPABASE_DB_URL to enable live queries" }
  ];

  return {
    rows: sampleRows,
    fields: Object.keys(sampleRows[0] ?? {}),
    rowCount: sampleRows.length,
    executionTimeMs: 0,
    notices: ["Mock data returned because no database connection string is configured.", `Received query: ${sql}`],
    truncated: false
  } satisfies SqlExecutionResult;
}

export async function executeSqlQuery(options: SqlExecutionOptions): Promise<SqlExecutionResult> {
  const poolInstance = getPool();
  const warnings = detectDangerousStatements(options.sql);

  if (!poolInstance) {
    return buildMockResult(options.sql);
  }

  const client = await poolInstance.connect();
  const start = performance.now();
  let result: QueryResult<Record<string, unknown>>;
  let truncated = false;

  try {
    if (options.enforceReadOnly && !isReadOnlyQuery(options.sql)) {
      throw new Error("Read-only mode is enabled. Modify the query or disable read-only mode to proceed.");
    }

    if (options.wrapTransaction) {
      await client.query("BEGIN");
    }

    result = await client.query<Record<string, unknown>>(options.sql);

    if (options.wrapTransaction) {
      await client.query("COMMIT");
    }
  } catch (error) {
    if (options.wrapTransaction) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to rollback transaction", rollbackError);
      }
    }

    throw error;
  } finally {
    client.release();
  }

  const executionTimeMs = performance.now() - start;
  const fields = result.fields?.map((field) => field.name) ?? [];
  const rowCount = typeof result.rowCount === "number" ? result.rowCount : result.rows.length;
  let rows = result.rows ?? [];

  if (options.rowLimit && options.rowLimit > 0 && rows.length > options.rowLimit) {
    rows = rows.slice(0, options.rowLimit);
    truncated = true;
    warnings.push(`Result truncated to ${options.rowLimit} rows.`);
  }

  return {
    rows,
    fields,
    rowCount,
    executionTimeMs,
    notices: warnings,
    truncated
  } satisfies SqlExecutionResult;
}

export function describeSqlError(error: unknown): SqlExecutionError {
  if (error instanceof Error) {
    const databaseError = error as Error & { code?: string; detail?: string; hint?: string };
    return {
      message: databaseError.message,
      code: databaseError.code,
      detail: databaseError.detail ?? null,
      hint: databaseError.hint ?? null
    } satisfies SqlExecutionError;
  }

  return {
    message: "Unknown error encountered while executing SQL"
  } satisfies SqlExecutionError;
}
