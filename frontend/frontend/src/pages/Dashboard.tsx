// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Activity,
  TrendingUp,
  Users,
  Gavel,
  FileText,
  AlertTriangle,
  Zap,
  Radio,
  ArrowUpRight,
  MousePointerClick,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useFilters } from "../lib/filters-store";
import {
  getKpiTotals,
  getYearlyTrend,
  getFIRsByDistrict,
  getFIRsByCrimeGroup,
} from "../lib/fir-queries";
import { GlobalFilters } from "../components/dashboard/GlobalFilters";
import { KpiDrilldownModal } from "../components/dashboard/KpiDrilldownModal";

const KPI_COLORS = ["#008DDA", "#41C9E2", "#FFA33C", "#10b981", "#e11d48", "#7c3aed"];
const CHART_COLORS = ["#008DDA", "#41C9E2", "#FFA33C", "#e11d48", "#7c3aed", "#10b981", "#f59e0b"];

// Static AI insights (from Project 1 style) — these feel like synthesized AI summaries
const AI_INSIGHTS = [
  { id: 1, severity: "High", text: "Unusual spike in theft-related FIRs across Bengaluru Urban — 34% above 6-month rolling average. Joint patrol protocol recommended for Whitefield and Koramangala sub-divisions." },
  { id: 2, severity: "High", text: "Criminal network cluster detected with 7-node interconnection spanning 3 districts. Human intelligence validation required before coordinated action." },
  { id: 3, severity: "Medium", text: "Predictive model indicates 68% probability of escalation in cybercrime incidents over the next 30-day window based on current trajectory vectors." },
  { id: 4, severity: "Medium", text: "Case resolution velocity declining by 12% YoY in coastal districts — resource reallocation analysis flagged for review by State Intelligence Directorate." },
];

// Static activity feed (from Project 1) — mimics operational log entries
const ACTIVITY_LOG = [
  { id: 1, type: "FIR_FILED", time: "2 min ago", text: "New FIR registered under IPC 420 at Whitefield PS, Bengaluru Urban — suspect identified." },
  { id: 2, type: "ARREST", time: "18 min ago", text: "Accused apprehended in Mysuru City — warrant from Sessions Court executed successfully." },
  { id: 3, type: "AI_ALERT", time: "41 min ago", text: "Predictive hotspot alert generated for Hubballi-Dharwad North Zone — elevated risk index." },
  { id: 4, type: "REPORT", time: "1 hr ago", text: "Q3 State-level crime synthesis report compiled and dispatched to DGP Headquarters." },
  { id: 5, type: "NETWORK", time: "2 hr ago", text: "Criminal network graph updated with 3 new node connections from inter-state intelligence feed." },
];

type DrillModal = { label: string; value: string; color: string } | null;

export default function Dashboard() {
  const { user } = useAuth();
  const filters = useFilters();
  const f = { years: filters.years, districts: filters.districts, crimeGroups: filters.crimeGroups, firStages: filters.firStages };
  const [drillModal, setDrillModal] = useState<DrillModal>(null);

  const kpi = useQuery({ queryKey: ["kpi", f], queryFn: () => getKpiTotals(f) });
  const trend = useQuery({ queryKey: ["yearly", f], queryFn: () => getYearlyTrend(f) });
  const byDistrict = useQuery({ queryKey: ["byDistrict", f], queryFn: () => getFIRsByDistrict(f) });
  const byGroup = useQuery({ queryKey: ["byGroup", f], queryFn: () => getFIRsByCrimeGroup(f) });

  const stats = [
    { key: "Total FIRs", val: kpi.data?.total_firs, icon: FileText, color: KPI_COLORS[0], clickable: true },
    { key: "Victims", val: kpi.data?.total_victims, icon: Users, color: KPI_COLORS[1], clickable: true },
    { key: "Arrested", val: kpi.data?.total_arrested, icon: ShieldCheck, color: KPI_COLORS[2], clickable: true },
    { key: "Chargesheeted", val: kpi.data?.total_chargesheeted, icon: Gavel, color: KPI_COLORS[5], clickable: true },
    { key: "Convictions", val: kpi.data?.total_convictions, icon: TrendingUp, color: KPI_COLORS[3], clickable: true },
    { key: "AI Alerts", val: 348, icon: AlertTriangle, color: KPI_COLORS[4], clickable: false },
  ];

  const typeColor: Record<string, string> = {
    FIR_FILED: "#008DDA",
    ARREST: "#FFA33C",
    AI_ALERT: "#e11d48",
    REPORT: "#10b981",
    NETWORK: "#7c3aed",
  };

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-[calc(100vh-3.5rem)]">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            National Intelligence Console
            <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 uppercase tracking-widest">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Secure Node Deployment Framework ·{" "}
            <span className="font-semibold text-[#008DDA] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              {user?.role} Workspace
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 status-live" />
            <span className="text-slate-700 font-medium">Supabase Node Live</span>
            <span className="text-slate-400">·</span>
            <span className="text-[#008DDA] font-bold">
              {kpi.data?.total_firs?.toLocaleString() ?? "…"}
            </span>
            <span className="text-slate-500">records</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-mono">
            <Radio className="h-3.5 w-3.5 text-fuchsia-500 animate-pulse" />
            <span className="text-slate-600">AI Engine Active</span>
          </div>
        </div>
      </div>

      {/* ── Global Filters ── */}
      <GlobalFilters />

      {/* ── KPI Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ key, val, icon: Icon, color, clickable }) => (
          <div
            key={key}
            className={`tactical-card p-4 relative overflow-hidden group hover-lift ${clickable ? "cursor-pointer select-none" : ""}`}
            onClick={() => {
              if (!clickable || kpi.isLoading) return;
              setDrillModal({ label: key, value: val?.toLocaleString() ?? "0", color });
            }}
          >
            {/* Colored accent left bar */}
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ background: color, opacity: 0.85 }}
            />
            <div className="pl-1">
              <div className="flex items-start justify-between mb-2">
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono leading-tight">
                  {key}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
              </div>
              <span className="block text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {kpi.isLoading ? (
                  <span className="text-slate-300 animate-pulse text-lg">—</span>
                ) : (
                  val?.toLocaleString() ?? "0"
                )}
              </span>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-[9px] text-emerald-600 font-mono">vs prev yr</span>
                </div>
                {clickable && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MousePointerClick className="h-3 w-3" style={{ color }} />
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mid Section: Activity Feed + AI Threat Panel ── */}
      {/* Taken directly from Project 1's Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Operational Log Stream (Project 1 concept) */}
        <div className="tactical-card p-5 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Activity className="h-4 w-4 text-[#008DDA]" />
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest font-mono">
              Operational Log Stream
            </span>
          </div>
          <div className="space-y-3.5 flex-1">
            {ACTIVITY_LOG.map((act) => (
              <div key={act.id} className="text-xs border-b border-slate-50 pb-3 last:border-none last:pb-0 group">
                <div className="flex justify-between items-center mb-1">
                  <span
                    className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                    style={{
                      color: typeColor[act.type] ?? "#64748b",
                      borderColor: `${typeColor[act.type] ?? "#64748b"}40`,
                      background: `${typeColor[act.type] ?? "#64748b"}10`,
                    }}
                  >
                    {act.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                </div>
                <p className="text-slate-700 leading-relaxed mt-1">{act.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Synthesized Threat Evaluation Matrix (Project 1 concept) */}
        <div className="tactical-card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <ShieldCheck className="h-4 w-4 text-rose-500" />
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest font-mono">
              AI Synthesized Threat Evaluation Matrix
            </span>
            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200">
              <Zap className="h-3 w-3 text-rose-500" />
              <span className="text-[9px] font-bold text-rose-600 font-mono uppercase">Live</span>
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {AI_INSIGHTS.map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-xl border flex items-start gap-3 transition-all hover:shadow-sm hover:bg-white"
                style={{
                  background: "rgba(248,250,252,0.8)",
                  borderColor: ins.severity === "High" ? "rgba(254,205,211,0.7)" : "rgba(226,232,240,0.8)",
                }}
              >
                <span className={ins.severity === "High" ? "badge-critical" : "badge-warning"}>
                  {ins.severity}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed flex-1">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts: Yearly FIR Trend + Top Crime Groups ── */}
      {/* From Project 2 — real Recharts with Supabase data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Yearly FIR Trend */}
        <div className="tactical-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Activity className="h-4 w-4 text-[#008DDA]" />
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest font-mono">
              Yearly FIR Trend
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend.data ?? []}>
                <defs>
                  <linearGradient id="firG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#008DDA" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#008DDA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFA33C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FFA33C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} />
                <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e2e8f0", fontFamily: "JetBrains Mono, monospace" }}
                />
                <Area type="monotone" dataKey="total_firs" stroke="#008DDA" strokeWidth={2.5} fill="url(#firG)" name="FIRs" />
                <Area type="monotone" dataKey="total_arrested" stroke="#FFA33C" strokeWidth={2} fill="url(#arrG)" name="Arrested" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Crime Groups */}
        <div className="tactical-card p-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <ShieldCheck className="h-4 w-4 text-rose-500" />
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest font-mono">
              Top Crime Groups
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={(byGroup.data ?? []).slice(0, 7)} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} />
                <YAxis type="category" dataKey="crime_group" width={110} tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, fontFamily: "JetBrains Mono, monospace" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(byGroup.data ?? []).slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── FIRs per District Bar Chart ── */}
      <div className="tactical-card p-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Activity className="h-4 w-4 text-[#008DDA]" />
          <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest font-mono">
            FIRs per District — Top 15
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={(byDistrict.data ?? []).slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="district" tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }} angle={-30} textAnchor="end" interval={0} height={70} />
              <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, fontFamily: "JetBrains Mono, monospace" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {(byDistrict.data ?? []).slice(0, 15).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── KPI Drill-down Modal ── */}
      <KpiDrilldownModal
        isOpen={drillModal !== null}
        onClose={() => setDrillModal(null)}
        kpiLabel={drillModal?.label ?? ""}
        kpiValue={drillModal?.value ?? ""}
        kpiColor={drillModal?.color ?? "#008DDA"}
        filters={f}
      />

    </div>
  );
}
