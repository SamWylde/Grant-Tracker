import { performance } from "node:perf_hooks";
import { Pool, type QueryResult } from "pg";

type ExecuteSqlOptions = {
  readOnly?: boolean;
  wrapInTransaction?: boolean;
  rowLimit?: number;
};

type QueryExecutionSummary = {
  rows: Record<string, unknown>[];
  rowCount: number;
  columns: string[];
  executionTimeMs: number;
  isSelect: boolean;
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("SUPABASE_DB_URL is required to execute admin SQL queries.");
    }
    pool = new Pool({ connectionString, ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : false });
  }
  return pool;
}

function ensureSelectLimit(query: string, limit: number): string {
  const selectRegex = /^\s*select\b/i;
  if (!selectRegex.test(query)) return query;

  const hasLimit = /\blimit\b/i.test(query);
  if (hasLimit) return query;

  const trimmed = query.trim().replace(/;$/, "");
  return `${trimmed} LIMIT ${limit}`;
}

export function isSelectQuery(query: string): boolean {
  return /^\s*select\b/i.test(query);
}

export async function executeSql(query: string, options: ExecuteSqlOptions = {}): Promise<QueryExecutionSummary> {
  const poolClient = await getPool().connect();
  const readOnly = options.readOnly ?? false;
  const wrapInTransaction = options.wrapInTransaction ?? false;
  const limit = options.rowLimit ?? 1000;

  const normalizedQuery = isSelectQuery(query) ? ensureSelectLimit(query, limit) : query;

  const start = performance.now();
  let result: QueryResult | null = null;
  const shouldBegin = wrapInTransaction || readOnly;

  try {
    if (shouldBegin) {
      await poolClient.query("BEGIN");
      if (readOnly) {
        await poolClient.query("SET TRANSACTION READ ONLY");
      }
    }

    result = await poolClient.query(normalizedQuery);

    if (shouldBegin) {
      await poolClient.query("COMMIT");
    }
  } catch (err) {
    if (shouldBegin) {
      try {
        await poolClient.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Failed to rollback admin SQL query", rollbackError);
      }
    }
    throw err;
  } finally {
    poolClient.release();
  }

  const end = performance.now();

  const rows = result?.rows ?? [];
  const rowCount = result?.rowCount ?? 0;
  const columns = result?.fields?.map((field) => field.name) ?? [];

  return {
    rows,
    rowCount,
    columns,
    executionTimeMs: Math.round(end - start),
    isSelect: isSelectQuery(normalizedQuery)
  } satisfies QueryExecutionSummary;
}

export type { ExecuteSqlOptions, QueryExecutionSummary };
