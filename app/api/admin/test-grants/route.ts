import { NextResponse, type NextRequest } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { requireAdminContext } from "@/lib/admin/auth";

const GRANTS_ENDPOINT = "https://www.grants.gov/grantsws/rest/opportunities/search";

function parseHeaderLines(headersText: string | null | undefined): Record<string, string> {
  if (!headersText) return {};
  return headersText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, line) => {
      const [rawKey, ...rest] = line.split(":");
      if (!rawKey || rest.length === 0) return acc;
      const key = rawKey.trim();
      const value = rest.join(":").trim();
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
}

function buildSearchParams(payload: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  if (payload.sortBy) params.set("sortBy", String(payload.sortBy));
  if (typeof payload.startRecordNum === "number") params.set("startRecordNum", String(payload.startRecordNum));
  if (typeof payload.numberOfRecords === "number") {
    const limited = Math.min(1000, Math.max(1, Number(payload.numberOfRecords)));
    params.set("numberOfRecords", String(limited));
  }
  if (payload.keyword) params.set("keyword", String(payload.keyword));
  if (payload.oppNum) params.set("oppNum", String(payload.oppNum));
  if (payload.cfda) params.set("cfda", String(payload.cfda));
  if (Array.isArray(payload.states)) {
    for (const value of payload.states) {
      params.append("state", String(value));
    }
  }
  if (Array.isArray(payload.categories)) {
    for (const value of payload.categories) {
      params.append("category", String(value));
    }
  }
  return params;
}

export async function POST(request: NextRequest) {
  let adminContext;
  try {
    adminContext = await requireAdminContext({ path: request.nextUrl.pathname, redirectOnFailure: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 403 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const params = buildSearchParams(payload);
  const headersMap = parseHeaderLines(typeof payload.headers === "string" ? payload.headers : "");
  if (!headersMap.Accept) {
    headersMap.Accept = "application/json";
  }
  if (payload.apiKey) {
    headersMap["X-Api-Key"] = String(payload.apiKey);
  }

  const url = `${GRANTS_ENDPOINT}?${params.toString()}`;

  await logAdminAction({
    adminUserId: adminContext.userId,
    actionType: "grants_gov_request",
    actionDetails: {
      url,
      headers: headersMap,
      payload: payload ?? null
    }
  });

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headersMap
    });
    const text = await response.text();

    await logAdminAction({
      adminUserId: adminContext.userId,
      actionType: "grants_gov_response",
      actionDetails: {
        status: response.status,
        url
      }
    });

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to contact Grants.gov API";
    await logAdminAction({
      adminUserId: adminContext.userId,
      actionType: "grants_gov_error",
      actionDetails: {
        url,
        message
      }
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
