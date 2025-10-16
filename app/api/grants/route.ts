import { GrantsRepository, mapGrantRecordsToOpportunities } from "@/lib/supabase/grants-repository";

export const runtime = "nodejs";

function parseNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const states = params.get("states");
  const focusAreas = params.get("focusAreas");
  const dueWithinDays = parseNumber(params.get("dueWithinDays"));
  const minAward = parseNumber(params.get("minAward"));
  const maxAward = parseNumber(params.get("maxAward"));
  const query = params.get("q");

  const filters = {
    states: states ? states.split(",").map((value) => value.trim()).filter(Boolean) : undefined,
    focusAreas: focusAreas
      ? focusAreas.split(",").map((value) => value.trim()).filter(Boolean)
      : undefined,
    dueWithinDays,
    minAward,
    maxAward,
    query: query ?? undefined
  };

  try {
    const repository = new GrantsRepository();
    const records = await repository.getGrants(filters);
    const grants = mapGrantRecordsToOpportunities(records);

    return Response.json({ grants, count: grants.length, source: "grants.gov" });
  } catch (error) {
    console.error("Error fetching grants:", error);
    return Response.json({ error: "Failed to fetch grants", grants: [], count: 0 }, { status: 500 });
  }
}
