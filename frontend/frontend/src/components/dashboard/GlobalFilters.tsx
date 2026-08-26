// @ts-nocheck
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "../../lib/fir-queries";
import { useFilters } from "../../lib/filters-store";
import { Filter, RotateCcw, ChevronDown } from "lucide-react";

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-mono font-medium ${
        active
          ? "text-white shadow-sm"
          : "bg-white border-slate-200 text-slate-600 hover:border-[#008DDA] hover:text-[#008DDA]"
      }`}
      style={active ? {
        background: "linear-gradient(135deg, #008DDA, #0069c2)",
        borderColor: "#008DDA",
      } : undefined}
    >
      {label}
    </button>
  );
}

export function GlobalFilters() {
  const { years, districts, crimeGroups, firStages, set, reset } = useFilters();
  const { data } = useQuery({
    queryKey: ["filter-options"],
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000,
  });
  const [open, setOpen] = React.useState<null | "years" | "districts" | "crimeGroups" | "firStages">(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const active = years.length + districts.length + crimeGroups.length + firStages.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-2.5 flex flex-wrap items-center gap-2"
      style={{ borderLeft: "3px solid #008DDA" }}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest pr-2 border-r border-slate-200 font-mono">
        <Filter className="h-3.5 w-3.5 text-[#008DDA]" /> Filters
        {active > 0 && (
          <span className="ml-1 text-white rounded-full px-1.5 py-0.5 text-[9px] font-mono"
            style={{ background: "#008DDA" }}>
            {active}
          </span>
        )}
      </div>

      {(["years", "districts", "crimeGroups", "firStages"] as const).map((key) => {
        const label = { years: "Year", districts: "District", crimeGroups: "Crime Group", firStages: "Stage" }[key];
        const opts =
          key === "years" ? data?.years?.map(String) ?? []
          : key === "districts" ? data?.districts ?? []
          : key === "crimeGroups" ? data?.crime_groups ?? []
          : data?.fir_stages ?? [];
        const state = key === "years" ? years.map(String) : key === "districts" ? districts : key === "crimeGroups" ? crimeGroups : firStages;
        return (
          <div key={key} className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setOpen(open === key ? null : key)}
              className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all font-mono ${
                state.length ? "bg-blue-50 border-[#008DDA] text-[#008DDA]" : "bg-white border-slate-200 text-slate-700 hover:border-[#008DDA]"
              }`}
            >
              {label}{state.length ? ` (${state.length})` : ""}
              <ChevronDown className={`h-3 w-3 transition-transform ${open === key ? "rotate-180" : ""}`} />
            </button>
            {open === key && (
              <div className="absolute z-50 mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 w-64 max-h-72 overflow-y-auto"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,141,218,0.1)" }}>
                <div className="flex flex-wrap gap-1">
                  {opts.slice(0, 60).map((o) => {
                    const isActive = state.includes(o);
                    return (
                      <Chip
                        key={o}
                        label={o}
                        active={isActive}
                        onClick={() => {
                          if (key === "years") set({ years: toggle(years, Number(o)) });
                          else if (key === "districts") set({ districts: toggle(districts, o) });
                          else if (key === "crimeGroups") set({ crimeGroups: toggle(crimeGroups, o) });
                          else set({ firStages: toggle(firStages, o) });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {active > 0 && (
        <button
          onClick={reset}
          className="ml-auto text-[11px] flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-all font-mono"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      )}
    </div>
  );
}
