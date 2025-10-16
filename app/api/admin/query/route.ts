import { NextResponse, type NextRequest } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { requireAdminContext } from "@/lib/admin/auth";
import { executeSql, isSelectQuery } from "@/lib/admin/db";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitCap(): number {
  const raw = process.env.ADMIN_RATE_LIMIT_QUERIES_PER_HOUR;
  const fallback = 100;
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function checkRateLimit(userId: string) {
  const cap = getRateLimitCap();
  const now = Date.now();
  const record = rateLimitStore.get(userId);
  if (!record || record.resetAt < now) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return { allowed: true };
  }
  if (record.count >= cap) {
    return { allowed: false, retryAfter: Math.max(0, Math.floor((record.resetAt - now) / 1000)) };
  }
  record.count += 1;
  rateLimitStore.set(userId, record);
  return { allowed: true };
}

function containsWriteOperation(query: string): boolean {
  return /\b(insert|update|delete|create|drop|truncate|alter|grant|revoke|comment)\b/i.test(query);
}

function isDangerousQuery(query: string): boolean {
  return /\b(drop|truncate|alter)\b/i.test(query);
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let adminContext;
  try {
    adminContext = await requireAdminContext({ path, redirectOnFailure: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 403 }
    );
  }

  const { allowed, retryAfter } = checkRateLimit(adminContext.userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Query rate limit exceeded. Please wait before running more queries.", retryAfter },
      { status: 429,
        headers: {
          "Retry-After": String(retryAfter ?? 0)
        }
      }
    );
  }

  let payload: {
    query?: string;
    readOnly?: boolean;
    wrapInTransaction?: boolean;
    confirmDangerous?: boolean;
  };

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const query = payload.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "Query text is required." }, { status: 400 });
  }

  const readOnly = payload.readOnly ?? true;
  if (readOnly && !isSelectQuery(query)) {
    return NextResponse.json(
      { error: "Read-only mode only supports SELECT statements. Disable read-only mode to run write queries." },
      { status: 400 }
    );
  }

  const requiresConfirmation = !readOnly && (containsWriteOperation(query) || isDangerousQuery(query));
  if (requiresConfirmation && !payload.confirmDangerous) {
    return NextResponse.json(
      {
        error: "Confirmation required for write or potentially destructive queries.",
        confirmationRequired: true
      },
      { status: 412 }
    );
  }

  try {
    const result = await executeSql(query, {
      readOnly,
      wrapInTransaction: payload.wrapInTransaction ?? !readOnly
    });

    await logAdminAction({
      adminUserId: adminContext.userId,
      actionType: "run_sql_query",
      actionDetails: {
        query,
        readOnly,
        wrapInTransaction: payload.wrapInTransaction ?? !readOnly,
        rowCount: result.rowCount,
        executionTimeMs: result.executionTimeMs
      }
    });

    return NextResponse.json({
      rows: result.rows,
      rowCount: result.rowCount,
      columns: result.columns,
      executionTimeMs: result.executionTimeMs,
      isSelect: result.isSelect
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error while executing query.";
    await logAdminAction({
      adminUserId: adminContext.userId,
      actionType: "run_sql_query_error",
      actionDetails: {
        query,
        readOnly,
        message
      }
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
