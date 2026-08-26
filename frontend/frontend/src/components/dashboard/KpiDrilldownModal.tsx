// @ts-nocheck
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Building2, TrendingUp, MapPin, BarChart3, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { getFIRsByPoliceStation, type FirFilters } from "../../lib/fir-queries";

const COLORS = [
  "#008DDA", "#41C9E2", "#FFA33C", "#e11d48", "#7c3aed",
  "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#14b8a6",
];

interface KpiDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpiLabel: string;
  kpiValue: string;
  kpiColor: string;
  filters: FirFilters;
}

export function KpiDrilldownModal({
  isOpen,
  onClose,
  kpiLabel,
  kpiValue,
  kpiColor,
  filters,
}: KpiDrilldownModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["ps-drilldown", filters],
    queryFn: () => getFIRsByPoliceStation(filters, 30),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const total = data?.reduce((s, r) => s + r.count, 0) ?? 0;
  const top15 = (data ?? []).slice(0, 15);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 inset-0 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{
            boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,141,218,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="relative p-5 flex items-center justify-between overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${kpiColor}18 0%, ${kpiColor}08 100%)`,
              borderBottom: `1px solid ${kpiColor}25`,
            }}
          >
            {/* Accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ background: kpiColor }}
            />

            <div className="pl-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: kpiColor }} />
                <span
                  className="text-[10px] uppercase font-bold tracking-widest font-mono"
                  style={{ color: kpiColor }}
                >
                  Police Station Breakdown
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {kpiLabel}
                <span
                  className="ml-2 text-2xl font-extrabold font-mono"
                  style={{ color: kpiColor }}
                >
                  {kpiValue}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Top 15 police stations by FIR volume · {total.toLocaleString()} total across{" "}
                {data?.length ?? "…"} units
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#008DDA]" />
                <span className="text-sm font-mono">Querying police station records…</span>
              </div>
            ) : (
              <>
                {/* Bar Chart */}
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono mb-3">
                    <BarChart3 className="h-3.5 w-3.5 text-[#008DDA]" />
                    FIR Volume by Police Station
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={top15} layout="vertical" margin={{ left: 5, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="unit_name"
                          width={130}
                          tick={{ fontSize: 9.5, fontFamily: "JetBrains Mono, monospace" }}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 10, fontFamily: "JetBrains Mono, monospace" }}
                          formatter={(v: number) => [v.toLocaleString(), "FIRs"]}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {top15.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Station Table */}
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-widest font-mono mb-2">
                    <MapPin className="h-3.5 w-3.5 text-[#008DDA]" />
                    Station-wise Details
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "rgba(248,250,252,0.9)" }}>
                          <th className="text-left px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono border-b border-slate-200">Rank</th>
                          <th className="text-left px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono border-b border-slate-200">Police Station</th>
                          <th className="text-left px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono border-b border-slate-200">District</th>
                          <th className="text-right px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono border-b border-slate-200">FIRs</th>
                          <th className="text-right px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-slate-500 font-mono border-b border-slate-200">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data ?? []).map((row, i) => {
                          const share = total > 0 ? ((row.count / total) * 100).toFixed(1) : "0.0";
                          const barPct = top15[0]?.count ? Math.round((row.count / top15[0].count) * 100) : 0;
                          return (
                            <tr
                              key={row.unit_name}
                              className="border-b border-slate-100 last:border-0 hover:bg-blue-50/50 transition-colors"
                            >
                              <td className="px-3 py-2">
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold font-mono text-white"
                                  style={{ background: COLORS[i % COLORS.length] }}
                                >
                                  {i + 1}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-slate-800 font-mono text-[11px]">{row.unit_name}</div>
                                {/* Mini progress bar */}
                                <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden w-32">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${barPct}%`, background: COLORS[i % COLORS.length] }}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">{row.district}</td>
                              <td className="px-3 py-2 text-right font-bold font-mono text-slate-800">
                                {row.count.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="font-mono text-[10px] text-slate-500">{share}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer note */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <TrendingUp className="h-4 w-4 text-[#008DDA] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-blue-700 font-mono leading-relaxed">
                    Showing top {data?.length ?? 0} police stations by FIR volume under your active filters.
                    For deeper analysis, visit{" "}
                    <strong>Crime Analytics → Investigation Reports</strong> and apply the same filters.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
