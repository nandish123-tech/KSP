// All data fetched from FastAPI AppSail backend (no Supabase)
const API = (import.meta.env.VITE_API_URL || "http://localhost:8085") + "/api/v1/analytics";

export type FirFilters = {
  years?: number[];
  districts?: string[];
  crimeGroups?: string[];
  firStages?: string[];
};

function buildParams(f: FirFilters = {}) {
  const p: Record<string, string> = {};
  if (f.years?.length)       p.years       = f.years.join(",");
  if (f.districts?.length)   p.districts   = f.districts.join(",");
  if (f.crimeGroups?.length) p.crime_groups = f.crimeGroups.join(",");
  if (f.firStages?.length)   p.fir_stages  = f.firStages.join(",");
  return p;
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = `${API}${path}${query ? "?" + query : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json();
}

// KPI totals
export type KpiTotals = {
  total_firs: number;
  total_victims: number;
  total_arrested: number;
  total_convictions: number;
  total_chargesheeted: number;
};
export const getKpiTotals = (f?: FirFilters): Promise<KpiTotals> =>
  get("/kpi", buildParams(f));
export const getTotalFIRs          = async (f?: FirFilters) => (await getKpiTotals(f)).total_firs;
export const getTotalVictims       = async (f?: FirFilters) => (await getKpiTotals(f)).total_victims;
export const getTotalArrested      = async (f?: FirFilters) => (await getKpiTotals(f)).total_arrested;
export const getTotalConvictions   = async (f?: FirFilters) => (await getKpiTotals(f)).total_convictions;
export const getTotalChargesheeted = async (f?: FirFilters) => (await getKpiTotals(f)).total_chargesheeted;

// Charts
export const getFIRsByYear = (f?: FirFilters) =>
  get<Array<{ year: number; count: number }>>("/by-year", buildParams(f));

export const getFIRsByDistrict = (f?: FirFilters) =>
  get<Array<{ district: string; count: number }>>("/by-district", buildParams(f));

export const getFIRsByCrimeGroup = (f?: FirFilters) =>
  get<Array<{ crime_group: string; count: number }>>("/by-crime-group", buildParams(f));

export const getFIRsByCrimeHead = (f?: FirFilters) =>
  get<Array<{ crime_head: string; count: number }>>("/by-crime-head", buildParams(f));

export const getFIRsByMonth = (f?: FirFilters) =>
  get<Array<{ month: number; count: number }>>("/by-month", buildParams(f));

export const getFIRsByYearAndDistrict = (f?: FirFilters) =>
  get<Array<{ year: number; district: string; count: number }>>("/by-year-district", buildParams(f));

export const getFIRsByYearAndCrimeGroup = (f?: FirFilters) =>
  get<Array<{ year: number; crime_group: string; count: number }>>("/by-year-crime-group", buildParams(f));

// Victim demographics
export type VictimDemographics = {
  male_victims: number; female_victims: number;
  boy_victims: number; girl_victims: number; total_victims: number;
};
export const getVictimDemographics = (f?: FirFilters): Promise<VictimDemographics> =>
  get("/victim-demographics", buildParams(f));

export const getVictimDemographicsByCrime = (f?: FirFilters) =>
  get<Array<{ crime_group: string; male: number; female: number; boy: number; girl: number }>>(
    "/victim-demographics-by-crime", buildParams(f)
  );

// Accused vs Arrested
export type AccusedVsArrested = {
  total_accused: number; arrested_male: number; arrested_female: number;
  total_arrested: number; chargesheeted: number; convicted: number;
};
export const getAccusedVsArrested = (f?: FirFilters): Promise<AccusedVsArrested> =>
  get("/accused-vs-arrested", buildParams(f));

// Units
export const getTopUnits = (f?: FirFilters, limit = 25) =>
  get<Array<{ unit_name: string; district: string; count: number }>>(
    "/top-units", { ...buildParams(f), limit: String(limit) }
  );

export const getCrimeByComplaintMode = (f?: FirFilters) =>
  get<Array<{ complaint_mode: string; count: number }>>("/by-complaint-mode", buildParams(f));

export const getCrimeByFIRStage = (f?: FirFilters) =>
  get<Array<{ fir_stage: string; count: number }>>("/by-stage", buildParams(f));

export const getCrimeByPlaceOfOffence = (f?: FirFilters) =>
  get<Array<{ place: string; count: number }>>("/by-place", buildParams(f));

// District deep dive
export const getDistrictDeepDive = (district: string, f?: FirFilters) =>
  get<Array<{ year: number; crime_group: string; crime_head: string; fir_count: number; victims: number; arrested: number; convicted: number }>>(
    "/district-deep-dive", { ...buildParams(f), district }
  );

// Yearly trend
export type YearlyTrendRow = {
  year: number; total_firs: number; total_victims: number; total_arrested: number;
  total_convicted: number; total_chargesheeted: number; arrested_male: number; arrested_female: number;
};
export const getYearlyTrend = (f?: FirFilters) =>
  get<YearlyTrendRow[]>("/yearly-trend", buildParams(f));

// Filter options
export type FilterOptions = {
  years: number[]; districts: string[];
  crime_groups: string[]; fir_stages: string[]; complaint_modes: string[];
};
export const getFilterOptions = () =>
  get<FilterOptions>("/filter-options");

// Geo
export const getGeoDistricts = () =>
  get<Array<{ district: string; lat: number; lng: number; fir_count: number; victims: number }>>(
    "/geo-districts"
  );

export const getGeoBeats = () =>
  get<Array<{ beat: string; unit_name: string; district: string; lat: number; lng: number; fir_count: number }>>(
    "/geo-beats"
  );

// Police station drill-down
export type PoliceStationRow = { unit_name: string; district: string; count: number; };
export const getFIRsByPoliceStation = (f?: FirFilters, limit = 30): Promise<PoliceStationRow[]> =>
  getTopUnits(f, limit);

// Recent FIRs for unit
export type RecentFirRow = {
  District_Name: string | null; UnitName: string | null;
  FIR_YEAR: number | null; FIR_MONTH: number | null; FIR_Day: number | null;
  CrimeGroup_Name: string | null; CrimeHead_Name: string | null;
  FIR_Stage: string | null; IOName: string | null;
  "Place of Offence": string | null; "VICTIM COUNT": number | null;
  "Accused Count": number | null; "Arrested Count\tNo.": number | null;
  "Conviction Count": number | null;
};
export const getRecentFIRsForUnit = (district: string, unit: string, limit = 50): Promise<RecentFirRow[]> =>
  get("/recent-cases", { district, unit, limit: String(limit) });
