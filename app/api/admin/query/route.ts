import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/admin/auth";
import { describeSqlError, executeSqlQuery } from "@/lib/admin/db";
import { logAdminSqlError, logAdminSqlQuery } from "@/lib/admin/audit";
import { MemoryRateLimiter } from "@/lib/admin/rate-limit";

export const runtime = "nodejs";

const DEFAULT_RATE_LIMIT = Number(process.env.ADMIN_RATE_LIMIT_QUERIES_PER_HOUR ?? 100);
const rateLimiter = new MemoryRateLimiter({ limit: DEFAULT_RATE_LIMIT, windowMs: 60 * 60 * 1000 });

function extractRequestMetadata(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0]?.trim() ?? null : request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ipAddress, userAgent };
}

export async function POST(request: Request) {
  const metadata = extractRequestMetadata(request);
  const access = await requireAdminAccess(metadata);

  if (!access.isAuthorized || !access.user) {
    const status =
      access.reason === "not-authenticated" ? 401 : access.reason === "not-configured" ? 503 : 403;
    const message =
      access.reason === "not-configured"
        ? "Supabase credentials are not configured for server-side execution."
        : "You do not have permission to access the admin SQL endpoint.";

    return NextResponse.json(
      {
        error: {
          message
        }
      },
      { status }
    );
  }

  let payload: {
    sql?: unknown;
    readOnlyMode?: unknown;
    wrapTransaction?: unknown;
    rowLimit?: unknown;
  };

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid JSON payload",
          detail: error instanceof Error ? error.message : undefined
        }
      },
      { status: 400 }
    );
  }

  const sql = typeof payload.sql === "string" ? payload.sql : "";

  if (!sql.trim()) {
    return NextResponse.json(
      {
        error: {
          message: "SQL query is required"
        }
      },
      { status: 400 }
    );
  }

  const readOnlyMode = payload.readOnlyMode !== false;
  const wrapTransaction = payload.wrapTransaction === true;
  const parsedRowLimit =
    typeof payload.rowLimit === "number" && payload.rowLimit > 0 ? Math.min(Math.floor(payload.rowLimit), 5000) : null;

  const rateAttempt = rateLimiter.attempt(access.user.id);

  if (!rateAttempt.allowed) {
    return NextResponse.json(
      {
        error: {
          message: "SQL rate limit exceeded. Please wait before running more queries."
        },
        rateLimit: rateAttempt
      },
      { status: 429 }
    );
  }

  try {
    const result = await executeSqlQuery({
      sql,
      enforceReadOnly: readOnlyMode,
      wrapTransaction,
      rowLimit: parsedRowLimit
    });

    await logAdminSqlQuery({
      userId: access.user.id,
      sql,
      rowCount: result.rowCount,
      executionTimeMs: result.executionTimeMs,
      readOnly: readOnlyMode,
      warnings: result.notices,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    return NextResponse.json({
      result,
      rateLimit: {
        remaining: rateAttempt.remaining,
        resetAt: rateAttempt.resetAt
      }
    });
  } catch (error) {
    const described = describeSqlError(error);

    await logAdminSqlError({
      userId: access.user.id,
      sql,
      error: described,
      readOnly: readOnlyMode,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });

    return NextResponse.json(
      {
        error: described,
        rateLimit: {
          remaining: rateAttempt.remaining,
          resetAt: rateAttempt.resetAt
        }
      },
      { status: 400 }
    );
  }
}
