import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export type AdminAuditEvent = {
  actionType: string;
  adminUserId?: string | null;
  actionDetails?: Record<string, unknown> | null;
  targetTable?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAdminAuditEvent(event: AdminAuditEvent): Promise<void> {
  if (!isSupabaseServerConfigured()) {
    console.info("[admin_audit_log]", event);
    return;
  }

  try {
    const client = getSupabaseServerClient();
    const { error } = await client.from("admin_audit_log").insert({
      admin_user_id: event.adminUserId ?? null,
      action_type: event.actionType,
      action_details: event.actionDetails ?? null,
      target_table: event.targetTable ?? null,
      target_id: event.targetId ?? null,
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null
    });

    if (error) {
      console.error("Failed to persist admin audit log entry", error);
    }
  } catch (error) {
    console.error("Unexpected error writing admin audit log", error);
  }
}

export async function logAdminAccessAttempt(event: {
  success: boolean;
  reason?: string;
  userId?: string;
  email?: string;
  platformAdmin?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await logAdminAuditEvent({
    actionType: event.success ? "admin_access_granted" : "admin_access_denied",
    adminUserId: event.userId ?? null,
    actionDetails: {
      reason: event.reason ?? null,
      email: event.email ?? null,
      platformAdmin: event.platformAdmin ?? null
    },
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null
  });
}

export async function logAdminSqlQuery(event: {
  userId: string;
  sql: string;
  rowCount: number;
  executionTimeMs: number;
  readOnly: boolean;
  warnings?: string[];
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await logAdminAuditEvent({
    actionType: "sql_query_executed",
    adminUserId: event.userId,
    actionDetails: {
      rowCount: event.rowCount,
      executionTimeMs: event.executionTimeMs,
      readOnly: event.readOnly,
      warnings: event.warnings ?? [],
      statement: event.sql
    },
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null
  });
}

export async function logAdminSqlError(event: {
  userId: string;
  sql: string;
  error: { message: string; code?: string; detail?: string | null; hint?: string | null };
  readOnly: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await logAdminAuditEvent({
    actionType: "sql_query_failed",
    adminUserId: event.userId,
    actionDetails: {
      statement: event.sql,
      message: event.error.message,
      code: event.error.code ?? null,
      detail: event.error.detail ?? null,
      hint: event.error.hint ?? null,
      readOnly: event.readOnly
    },
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null
  });
}
