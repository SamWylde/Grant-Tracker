import grantsData from "@/data/sample-grants.json";
import { applyGrantFilters, type GrantOpportunity } from "@/lib/grants";

export const runtime = "nodejs";

const ALL_GRANTS = grantsData as GrantOpportunity[];

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
  const query = params.get("q")?.toLowerCase() ?? null;

  const filters = {
    states: states ? states.split(",").map((value) => value.trim()).filter(Boolean) : undefined,
    focusAreas: focusAreas
      ? focusAreas.split(",").map((value) => value.trim()).filter(Boolean)
      : undefined,
    dueWithinDays,
    minAward,
    maxAward
  };

  let grants = applyGrantFilters(ALL_GRANTS, filters);

  if (query) {
    grants = grants.filter((grant) => {
      return (
        grant.title.toLowerCase().includes(query) ||
        grant.agency.toLowerCase().includes(query) ||
        grant.summary.toLowerCase().includes(query) ||
        grant.focusAreas.some((area) => area.toLowerCase().includes(query))
      );
    });
  }

  return Response.json({ grants, count: grants.length });
}
