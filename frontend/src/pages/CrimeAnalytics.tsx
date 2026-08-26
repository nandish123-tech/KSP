// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useFilters } from "../lib/filters-store";
import {
  getFIRsByMonth, getFIRsByCrimeGroup, getFIRsByDistrict,
  getTopUnits, getCrimeByFIRStage, getFIRsByYear,
  getVictimDemographics, getCrimeByComplaintMode,
} from "../lib/fir-queries";
import { GlobalFilters } from "../components/dashboard/GlobalFilters";

const PALETTE = ["#008DDA", "#41C9E2", "#FFA33C", "#e11d48", "#7c3aed", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tactical-card p-4 flex flex-col">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 border-b border-slate-100 pb-2 mb-3 font-mono flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#008DDA]" />
        {title}
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}


export default function CrimeAnalytics() {
  const filters = useFilters();
  const f = { years: filters.years, districts: filters.districts, crimeGroups: filters.crimeGroups, firStages: filters.firStages };

  const month = useQuery({ queryKey: ["a-month", f], queryFn: () => getFIRsByMonth(f) });
  const group = useQuery({ queryKey: ["a-group", f], queryFn: () => getFIRsByCrimeGroup(f) });
  const district = useQuery({ queryKey: ["a-district", f], queryFn: () => getFIRsByDistrict(f) });
  const units = useQuery({ queryKey: ["a-units", f], queryFn: () => getTopUnits(f, 10) });
  const stage = useQuery({ queryKey: ["a-stage", f], queryFn: () => getCrimeByFIRStage(f) });
  const year = useQuery({ queryKey: ["a-year", f], queryFn: () => getFIRsByYear(f) });
  const demo = useQuery({ queryKey: ["a-demo", f], queryFn: () => getVictimDemographics(f) });
  const mode = useQuery({ queryKey: ["a-mode", f], queryFn: () => getCrimeByComplaintMode(f) });

  const monthData = (month.data ?? []).map((r) => ({ ...r, name: MONTHS[(r.month - 1) % 12] ?? String(r.month) }));

  const rawStageData = stage.data ?? [];
  const sortedStageData = [...rawStageData].sort((a, b) => b.count - a.count);
  const topStages = sortedStageData.slice(0, 5);
  const otherStagesCount = sortedStageData.slice(5).reduce((sum, item) => sum + item.count, 0);
  const formatStageName = (s: string) => {
    if (!s) return "";
    if (s === "Others") return "Others";
    return s
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };
  const stageData = (
    otherStagesCount > 0 ? [...topStages, { fir_stage: "Others", count: otherStagesCount }] : topStages
  ).map((item) => ({
    ...item,
    formatted_stage: formatStageName(item.fir_stage),
  }));

  const demoData = demo.data
    ? [
        { name: "Male", value: demo.data.male_victims },
        { name: "Female", value: demo.data.female_victims },
        { name: "Boy", value: demo.data.boy_victims },
        { name: "Girl", value: demo.data.girl_victims },
      ]
    : [];

  return (
    <div className="p-6 md:p-8 space-y-5 overflow-y-auto h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#008DDA]" /> Advanced Analytics Matrix
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Live aggregate crime intelligence across Karnataka · {" "}
            <span className="text-[#008DDA] font-semibold">1,674,734 FIR records</span>
          </p>
        </div>
      </div>

      <GlobalFilters />


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Panel title="Monthly Incident Progression">
          <ResponsiveContainer>
            <AreaChart data={monthData}>
              <defs>
                <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#008DDA" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#008DDA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#008DDA" strokeWidth={2} fill="url(#m1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Crime Group Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={(group.data ?? []).slice(0, 6)}
                dataKey="count"
                nameKey="crime_group"
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={90}
                paddingAngle={2}
              >
                {(group.data ?? []).slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Inter-District Crime Volume (Top 10)">
          <ResponsiveContainer>
            <BarChart data={(district.data ?? []).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="district" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} height={70} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(district.data ?? []).slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top Reporting Units">
          <ResponsiveContainer>
            <BarChart data={(units.data ?? []).slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="unit_name" width={130} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#41C9E2" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Case Resolution Stages">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={stageData}
                dataKey="count"
                nameKey="formatted_stage"
                cx="50%" cy="50%"
                outerRadius={95}
                label={{ fontSize: 10 }}
              >
                {stageData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Yearly Trajectory">
          <ResponsiveContainer>
            <LineChart data={year.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Victim Demographics">
          <ResponsiveContainer>
            <RadarChart data={demoData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Complaint Mode Breakdown">
          <ResponsiveContainer>
            <BarChart data={mode.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="complaint_mode" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(mode.data ?? []).map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Yearly Arrested vs Convicted">
          <ResponsiveContainer>
            <BarChart data={year.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="count" fill="#008DDA" name="FIRs" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
