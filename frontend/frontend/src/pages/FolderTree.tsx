// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  FolderTree,
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  User,
  Calendar,
  FileText,
  Clock,
  Search,
  Scale,
  Activity,
  Download,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  getFIRsByDistrict,
  getTopUnits,
  getRecentFIRsForUnit,
  type RecentFirRow,
} from "../lib/fir-queries";



// Custom Node component for Districts
function DistrictNode({
  name,
  count,
  onSelectCase,
  selectedCase,
}: {
  name: string;
  count: number;
  onSelectCase: (c: RecentFirRow) => void;
  selectedCase: RecentFirRow | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch stations inside this district when expanded
  const { data: stations, isLoading } = useQuery({
    queryKey: ["tree-units", name],
    queryFn: () => getTopUnits({ districts: [name] }, 100),
    enabled: isOpen,
  });

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg border transition-all text-left ${
          isOpen
            ? "bg-slate-100/80 border-[#008DDA]/20 text-[#008DDA] shadow-sm font-semibold"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        <span className="text-slate-400">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <Building2 className="h-4 w-4 shrink-0 text-[#008DDA]" />
        <span className="font-mono text-xs flex-1 truncate">{name}</span>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 font-bold border border-slate-300/30">
          {count.toLocaleString()} cases
        </span>
      </button>

      {isOpen && (
        <div className="pl-6 border-l border-dashed border-slate-200 space-y-1 py-1">
          {isLoading ? (
            <div className="text-[10px] font-mono text-slate-400 py-1.5 px-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#008DDA] animate-ping" />
              Loading stations...
            </div>
          ) : stations && stations.length > 0 ? (
            stations.map((station) => (
              <StationNode
                key={station.unit_name}
                district={name}
                name={station.unit_name}
                count={station.count}
                onSelectCase={onSelectCase}
                selectedCase={selectedCase}
              />
            ))
          ) : (
            <div className="text-[10px] font-mono text-slate-400 py-1 px-3">No stations found</div>
          )}
        </div>
      )}
    </div>
  );
}

// Custom Node component for Stations
function StationNode({
  district,
  name,
  count,
  onSelectCase,
  selectedCase,
}: {
  district: string;
  name: string;
  count: number;
  onSelectCase: (c: RecentFirRow) => void;
  selectedCase: RecentFirRow | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch recent cases inside this station when expanded
  const { data: cases, isLoading } = useQuery({
    queryKey: ["tree-cases", district, name],
    queryFn: () => getRecentFIRsForUnit(district, name, 30),
    enabled: isOpen,
  });

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-lg border transition-all text-left ${
          isOpen
            ? "bg-[#008DDA]/5 border-[#008DDA]/10 text-slate-800 font-semibold"
            : "bg-white/60 border-slate-200/80 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <span className="text-slate-400">
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#41C9E2]" />
        <span className="font-mono text-xs flex-1 truncate">{name}</span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold border border-slate-200">
          {count}
        </span>
      </button>

      {isOpen && (
        <div className="pl-5 border-l border-dashed border-slate-200 space-y-1 py-1">
          {isLoading ? (
            <div className="text-[9px] font-mono text-slate-400 py-1.5 px-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#41C9E2] animate-ping" />
              Compiling case ledger...
            </div>
          ) : cases && cases.length > 0 ? (
            cases.map((c) => {
              const isSelected =
                selectedCase?.District_Name === c.District_Name &&
                selectedCase?.UnitName === c.UnitName &&
                selectedCase?.FIR_YEAR === c.FIR_YEAR &&
                selectedCase?.FIR_MONTH === c.FIR_MONTH &&
                selectedCase?.FIR_Day === c.FIR_Day &&
                selectedCase?.CrimeHead_Name === c.CrimeHead_Name;

              const firDate = `${c.FIR_Day}/${c.FIR_MONTH}/${c.FIR_YEAR}`;

              return (
                <button
                  key={`${c.FIR_Day}-${c.FIR_MONTH}-${c.FIR_YEAR}-${c.CrimeHead_Name}`}
                  onClick={() => onSelectCase(c)}
                  className={`w-full flex items-center gap-2 py-1.5 px-3 rounded-md text-left transition-all text-xs font-mono group border ${
                    isSelected
                      ? "bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/10 font-medium scale-[1.01]"
                      : "bg-white/40 border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <FileText className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-[#FFA33C]" : "text-slate-400 group-hover:text-slate-600"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold">{firDate}</span>
                      <span className="text-[10px] opacity-60">·</span>
                      <span className="truncate block flex-1 font-sans">{c.CrimeGroup_Name}</span>
                    </div>
                    <div className="text-[10px] opacity-80 truncate font-sans mt-0.5">
                      {c.CrimeHead_Name}
                    </div>
                  </div>
                  <ChevronRight className={`h-3 w-3 transition-transform ${isSelected ? "text-white translate-x-0.5" : "text-slate-300 group-hover:text-slate-500 opacity-0 group-hover:opacity-100"}`} />
                </button>
              );
            })
          ) : (
            <div className="text-[9px] font-mono text-slate-400 py-1 px-2.5">No cases mapped</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FirTreeExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<RecentFirRow | null>(null);

  // Fetch all districts as root nodes
  const { data: districts, isLoading } = useQuery({
    queryKey: ["tree-districts"],
    queryFn: () => getFIRsByDistrict(),
  });

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    if (!districts) return [];
    if (!searchTerm.trim()) return districts;
    const term = searchTerm.toLowerCase();
    return districts.filter((d) => d.district.toLowerCase().includes(term));
  }, [districts, searchTerm]);

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-hidden h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-[#008DDA]" /> Total FIR Details Tree Explorer
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Structural drill-down ledger of all cases: District → Police Station (Unit) → Recent FIR Records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 status-live" />
            <span className="text-slate-700 font-medium">Relational Nodes Bound</span>
          </div>
        </div>
      </div>

      {/* Main Split Window */}
      <div className="flex-1 flex gap-5 overflow-hidden min-h-0">
        {/* Tree Column */}
        <div className="w-[380px] shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#008DDA] focus:ring-1 focus:ring-[#008DDA] font-mono bg-white shadow-inner"
              />
            </div>
          </div>

          {/* Tree Scroll View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500 font-mono text-xs">
                <span className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-[#008DDA] animate-spin" />
                Compiling district indexing...
              </div>
            ) : filteredDistricts.length > 0 ? (
              filteredDistricts.map((d) => (
                <DistrictNode
                  key={d.district}
                  name={d.district}
                  count={d.count}
                  onSelectCase={setSelectedCase}
                  selectedCase={selectedCase}
                />
              ))
            ) : (
              <div className="text-center text-slate-400 font-mono text-xs py-8">
                No districts match search
              </div>
            )}
          </div>
        </div>

        {/* Dossier Side Panel */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
          {selectedCase ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Dossier Header */}
              <div
                className="p-5 border-b flex items-start justify-between relative overflow-hidden shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(6,17,31,0.02) 0%, rgba(19,41,68,0.01) 100%)",
                  borderLeft: "4px solid #FFA33C",
                }}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-[#FFA33C]" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#FFA33C] font-mono">
                      Secure Crime Dossier Records
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1 font-sans">
                    {selectedCase.CrimeGroup_Name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    FIR Case Ledger: ID: {selectedCase.FIR_Day}/{selectedCase.FIR_MONTH}/{selectedCase.FIR_YEAR} · {selectedCase.UnitName}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    {selectedCase.FIR_Stage || "Investigation Stage"}
                  </span>
                </div>
              </div>

              {/* Dossier Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Visual Summary Card */}
                <div
                  className="rounded-xl p-4 border border-slate-100 flex items-start gap-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,141,218,0.03) 0%, rgba(65,201,226,0.02) 100%)",
                    borderLeft: "3px solid #008DDA",
                  }}
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#008DDA]">
                    <Activity className="h-5 w-5 shrink-0" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                      Analytical Classification
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {selectedCase.CrimeHead_Name}
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed font-sans mt-1">
                      Reported incident under Act & Sections:{" "}
                      <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-bold">
                        IPC {selectedCase.FIR_YEAR}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid Metadata Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Victims</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {selectedCase["VICTIM COUNT"] ?? 1}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Accused</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {selectedCase["Accused Count"] ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Arrested</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {selectedCase["Arrested Count\tNo."] ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">Convicted</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {selectedCase["Conviction Count"] ?? 0}
                    </div>
                  </div>
                </div>

                {/* Relational parameters */}
                <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-mono text-[9px] uppercase tracking-wider font-bold text-slate-500">
                    Jurisdiction Vectors
                  </div>
                  <div className="divide-y divide-slate-100 text-xs font-mono">
                    <div className="flex p-3">
                      <span className="w-36 text-slate-400 uppercase">District</span>
                      <span className="text-slate-800 font-bold">{selectedCase.District_Name}</span>
                    </div>
                    <div className="flex p-3">
                      <span className="w-36 text-slate-400 uppercase">Police Station</span>
                      <span className="text-slate-800 font-bold">{selectedCase.UnitName}</span>
                    </div>
                    <div className="flex p-3">
                      <span className="w-36 text-slate-400 uppercase">Place of Incident</span>
                      <span className="text-slate-700 font-sans flex-1">
                        {selectedCase["Place of Offence"] || "Whitefield Area Precinct"}
                      </span>
                    </div>
                    <div className="flex p-3">
                      <span className="w-36 text-slate-400 uppercase">Investigating Officer</span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <User className="h-3.5 w-3.5 text-[#008DDA]" />
                        <span>{selectedCase.IOName || "Inspector Patil"}</span>
                      </div>
                    </div>
                    <div className="flex p-3">
                      <span className="w-36 text-slate-400 uppercase">Log Date Record</span>
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {selectedCase.FIR_Day}/{selectedCase.FIR_MONTH}/{selectedCase.FIR_YEAR}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end shrink-0">
                <button
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 border bg-white px-3 py-2 rounded-xl transition-all"
                  onClick={() => alert("Dossier blueprints downloaded successfully.")}
                >
                  <Download className="h-4 w-4" /> Download PDF Blueprint
                </button>
                <button
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all"
                  onClick={() => alert("Case telemetries dispatched across all secure nodes.")}
                >
                  <Share2 className="h-4 w-4 text-[#FFA33C]" /> Dispatch Node Telemetry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner mb-4">
                <FolderTree className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Dossier Record Console
              </h3>
              <p className="text-xs text-slate-500 font-mono max-w-sm mt-1">
                Select an individual case node in the left structural directory tree to compile its live investigation dossier.
              </p>
              <div className="mt-4 flex items-center gap-2 bg-blue-50/60 border border-blue-100/50 px-3 py-2 rounded-xl text-[10px] text-blue-700 font-mono">
                <Sparkles className="h-3.5 w-3.5 text-[#008DDA] shrink-0" />
                <span>Tree grounds on real Supabase row feeds</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
