const CATALYST_API_URL =
  "http://localhost:3000/server/project_rainfall_function/execute";

export interface FIRFilters {
  district?: string;
  year?: string;
  month?: string;
  crime_group?: string;
  crime_head?: string;
  stage?: string;
  fir_type?: string;
  unit?: string;
}

async function catalystRequest(
  params: Record<string, string | undefined>
) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, value);
    }
  });

  const response = await fetch(
    `${CATALYST_API_URL}?${query.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Catalyst API error: ${response.status}`
    );
  }

  const raw = await response.json();

  /*
   * catalyst serve returns:
   *
   * {
   *   "output": "{\"success\":true,...}"
   * }
   */

  const result =
    typeof raw.output === "string"
      ? JSON.parse(raw.output)
      : raw.output ?? raw;

  if (!result.success) {
    throw new Error(
      result.error || "Catalyst backend error"
    );
  }

  return result;
}


/* ---------------- SEARCH ---------------- */

export async function searchFIR(
  filters: FIRFilters = {}
) {
  return catalystRequest({
    action: "search",
    district: filters.district,
    year: filters.year,
    month: filters.month,
    crime_group: filters.crime_group,
    crime_head: filters.crime_head,
    stage: filters.stage,
    fir_type: filters.fir_type,
    unit: filters.unit,
  });
}


/* ---------------- KPI ---------------- */

export async function getKPI(
  filters: FIRFilters = {}
) {
  return catalystRequest({
    action: "kpi",
    district: filters.district,
    year: filters.year,
    month: filters.month,
    crime_group: filters.crime_group,
    crime_head: filters.crime_head,
    stage: filters.stage,
    fir_type: filters.fir_type,
    unit: filters.unit,
  });
}


/* ---------------- HEALTH ---------------- */

export async function healthCheck() {
  return catalystRequest({
    action: "health",
  });
}