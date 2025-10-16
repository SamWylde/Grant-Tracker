import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type AuditLogPayload = {
  adminUserId: string | null;
  actionType: string;
  actionDetails?: Record<string, unknown>;
  targetTable?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAdminAction(payload: AuditLogPayload): Promise<void> {
  const client = getSupabaseServiceRoleClient();
  try {
    const { error } = await client.from("admin_audit_log").insert({
      admin_user_id: payload.adminUserId,
      action_type: payload.actionType,
      action_details: payload.actionDetails ?? null,
      target_table: payload.targetTable ?? null,
      target_id: payload.targetId ?? null,
      ip_address: payload.ipAddress ?? null,
      user_agent: payload.userAgent ?? null
    });

    if (error) {
      console.error("Failed to persist admin audit log entry", error);
    }
  } catch (error) {
    console.error("Unexpected error while writing admin audit log entry", error);
  }
}

export async function logAdminAccessAttempt({
  userId,
  path,
  status,
  ip,
  userAgent,
  reason
}: {
  userId: string | null;
  path: string;
  status: "authorized" | "denied";
  ip?: string | null;
  userAgent?: string | null;
  reason?: string;
}) {
  await logAdminAction({
    adminUserId: userId,
    actionType: "admin_access_attempt",
    actionDetails: {
      path,
      status,
      reason: reason ?? null
    },
    ipAddress: ip ?? null,
    userAgent: userAgent ?? null
  });
}
