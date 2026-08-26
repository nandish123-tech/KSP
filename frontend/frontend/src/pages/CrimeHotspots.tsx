// @ts-nocheck

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Map as MapIcon, Layers, Filter, MapPin, Loader2, Flame, Radio,
  ShieldAlert, Crosshair, Activity, Play, Pause, Sparkles,
} from "lucide-react";
import type * as LeafletNS from "leaflet";
import { loadPoliceStations, KARNATAKA_CENTER, type PoliceStation } from "../lib/police-stations";
import { getGeoDistricts, getGeoBeats, getFIRsByCrimeGroup } from "../lib/fir-queries";
import { useFilters } from "../lib/filters-store";
import { GlobalFilters } from "../components/dashboard/GlobalFilters";

type LayerMode = "heat" | "risk" | "beats" | "grid";
type District = { district: string; lat: number; lng: number; fir_count: number; victims: number };
type Beat = { beat: string; unit_name: string; district: string; lat: number; lng: number; fir_count: number };

const TILES = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  sat: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

export default function CrimeHotspots() {
  const [showStations, setShowStations] = useState(true);
  const [layer, setLayer] = useState<LayerMode>("heat");
  const [pulse, setPulse] = useState(true);
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [tile, setTile] = useState<keyof typeof TILES>("dark");
  const [ready, setReady] = useState(false);
  const [stations, setStations] = useState<PoliceStation[]>([]);

  const filters = useFilters();
  const f = { years: filters.years, districts: filters.districts, crimeGroups: filters.crimeGroups, firStages: filters.firStages };

  const districts = useQuery({
    queryKey: ["geo-districts"],
    queryFn: getGeoDistricts,
    staleTime: 15 * 60 * 1000, // Cache districts for 15 minutes
    gcTime: 30 * 60 * 1000,
  });

  const beats = useQuery({
    queryKey: ["geo-beats"],
    queryFn: getGeoBeats,
    enabled: layer === "beats",
    staleTime: 30 * 60 * 1000, // Cache heavy beats query for 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  const groups = useQuery({
    queryKey: ["hs-groups", f],
    queryFn: () => getFIRsByCrimeGroup(f),
  });

  // ------- imperative leaflet -------
  const mapEl = useRef<HTMLDivElement>(null);
  const LRef = useRef<typeof LeafletNS | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const tileLayerRef = useRef<LeafletNS.TileLayer | null>(null);
  const overlayRef = useRef<LeafletNS.LayerGroup | null>(null);
  const stationsLayerRef = useRef<LeafletNS.LayerGroup | null>(null);

  // init + cleanup
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [Lmod] = await Promise.all([import("leaflet"), loadPoliceStations().then(setStations)]);
      if (cancelled || !mapEl.current) return;
      const L = (Lmod.default ?? Lmod) as typeof LeafletNS;
      LRef.current = L;

      // guard against reused container (Suspense reveal / HMR)
      const container = mapEl.current as HTMLDivElement & { _leaflet_id?: number };
      if (container._leaflet_id) container._leaflet_id = undefined as unknown as number;

      const map = L.map(container, {
        center: KARNATAKA_CENTER,
        zoom: 7,
        preferCanvas: true,
        zoomControl: true,
      });
      mapRef.current = map;
      tileLayerRef.current = L.tileLayer(TILES.dark, { attribution: "&copy; CARTO / Esri" }).addTo(map);
      overlayRef.current = L.layerGroup().addTo(map);
      stationsLayerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove();
      } catch { /* ignore */ }
      mapRef.current = null;
      tileLayerRef.current = null;
      overlayRef.current = null;
      stationsLayerRef.current = null;
      setReady(false);
    };
  }, []);

  // tile switch
  useEffect(() => {
    const L = LRef.current; const map = mapRef.current;
    if (!L || !map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(TILES[tile], { attribution: "&copy; CARTO / Esri" }).addTo(map);
  }, [tile, ready]);

  const maxCount = useMemo(
    () => Math.max(1, ...(districts.data ?? []).map((d) => d.fir_count)),
    [districts.data],
  );

  // render overlays
  useEffect(() => {
    const L = LRef.current; const grp = overlayRef.current;
    if (!L || !grp || !ready) return;
    grp.clearLayers();

    const list = (districts.data ?? []) as District[];
    const wobble = (seed: number) => (pulse ? 1 + Math.sin((tick + seed) / 1.2) * 0.08 : 1);

    if (layer === "heat") {
      list.forEach((d) => {
        const intensity = d.fir_count / maxCount;
        const color = intensity > 0.66 ? "#e11d48" : intensity > 0.33 ? "#FFA33C" : "#008DDA";
        const base = 8000 + intensity * 42000;
        L.circle([d.lat, d.lng], {
          radius: base * wobble(d.lat),
          color, fillColor: color, fillOpacity: 0.28 + intensity * 0.25, weight: 1,
        })
          .bindPopup(popupHtml(d))
          .on("click", () => setSelected(d.district))
          .addTo(grp);
      });
    } else if (layer === "risk") {
      list.forEach((d) => {
        const intensity = d.fir_count / maxCount;
        const color = intensity > 0.66 ? "#e11d48" : intensity > 0.33 ? "#FFA33C" : "#008DDA";
        [0.4, 0.75, 1].forEach((k, i) => {
          L.circle([d.lat, d.lng], {
            radius: 12000 * k * (1 + intensity * 2),
            color, fillOpacity: 0, weight: 1.2, opacity: 0.8 - i * 0.25, dashArray: "4 6",
          }).addTo(grp);
        });
      });
    } else if (layer === "grid") {
      [...list].sort((a, b) => b.fir_count - a.fir_count).slice(0, 12).forEach((d, idx) => {
        const intensity = d.fir_count / maxCount;
        const size = 6 + intensity * 14 + (pulse ? (tick + idx) % 5 : 0);
        L.circleMarker([d.lat, d.lng], {
          radius: size, color: "#22d3ee", fillColor: "#22d3ee", fillOpacity: 0.15, weight: 2, dashArray: "2 4",
        }).bindPopup(popupHtml(d, true)).addTo(grp);
      });
    } else if (layer === "beats") {
      const bl = (beats.data ?? []) as Beat[];
      bl.slice(0, 500).forEach((b) => {
        L.circleMarker([b.lat, b.lng], {
          radius: 2 + Math.log2(b.fir_count + 1), color: "#a3e635", fillColor: "#a3e635", fillOpacity: 0.7, weight: 0,
        }).bindPopup(`<div style="font-size:11px"><b>${escapeHtml(b.beat)}</b><br/>${escapeHtml(b.unit_name)} · ${escapeHtml(b.district)}<br/>FIRs: <b>${b.fir_count}</b></div>`).addTo(grp);
      });
    }
  }, [ready, layer, districts.data, beats.data, maxCount, tick, pulse]);

  // stations layer
  useEffect(() => {
    const L = LRef.current; const grp = stationsLayerRef.current;
    if (!L || !grp || !ready) return;
    grp.clearLayers();
    if (!showStations) return;
    stations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 2.5, color: "#FFA33C", fillColor: "#FFA33C", fillOpacity: 0.95, weight: 0,
      }).bindPopup(`<div style="font-size:11px"><b>${escapeHtml(s.name)}</b><br/><span style="font-family:monospace;color:#64748b">${escapeHtml(s.code)}</span></div>`).addTo(grp);
    });
  }, [ready, showStations, stations]);

  // pulse ticker
  useEffect(() => {
    if (!pulse) return;
    const id = setInterval(() => setTick((t) => t + 1), 1600);
    return () => clearInterval(id);
  }, [pulse]);

  const stats = useMemo(() => {
    const list = (districts.data ?? []) as District[];
    const total = list.reduce((s, d) => s + d.fir_count, 0);
    const critical = list.filter((d) => d.fir_count / maxCount > 0.66).length;
    const moderate = list.filter((d) => { const r = d.fir_count / maxCount; return r > 0.33 && r <= 0.66; }).length;
    const top = [...list].sort((a, b) => b.fir_count - a.fir_count)[0];
    return { total, critical, moderate, top };
  }, [districts.data, maxCount]);

  return (
    <div className="p-4 md:p-6 space-y-4 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapIcon className="h-6 w-6 text-[#008DDA]" /> Geospatial Threat Grid
          </h1>
          <p className="text-xs text-slate-600 font-mono">
            {stations.length ? `${stations.length} stations` : "Loading…"} · {districts.data?.length ?? 0} district clusters · Live pulse {pulse ? "ON" : "OFF"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(TILES) as (keyof typeof TILES)[]).map((t) => (
            <button key={t} onClick={() => setTile(t)}
              className={`text-[10px] px-2 py-1.5 rounded-md font-mono font-bold border transition ${
                tile === t ? "bg-slate-900 text-emerald-400 border-slate-900" : "bg-white text-slate-600 border-slate-200"
              }`}>{t.toUpperCase()}</button>
          ))}
          <button onClick={() => setPulse((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-semibold border shadow-sm transition ${
              pulse ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-700 border-slate-200"
            }`}>
            {pulse ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} Pulse
          </button>
          <button onClick={() => setShowStations((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-semibold border shadow-sm transition ${
              showStations ? "bg-[#FFA33C] text-white border-[#FFA33C]" : "bg-white text-slate-700 border-slate-200"
            }`}>
            <Layers className="h-3.5 w-3.5" /> Stations
          </button>
        </div>
      </div>

      <GlobalFilters />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Flame className="h-4 w-4" />} label="Total FIRs" value={stats.total.toLocaleString()} tone="sky" />
        <StatCard icon={<ShieldAlert className="h-4 w-4" />} label="Critical Zones" value={String(stats.critical)} tone="rose" />
        <StatCard icon={<Radio className="h-4 w-4" />} label="Moderate Zones" value={String(stats.moderate)} tone="amber" />
        <StatCard icon={<Crosshair className="h-4 w-4" />} label="Apex District" value={stats.top?.district ?? "—"} tone="violet" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {([
          { k: "heat", label: "Heat Bloom", icon: <Flame className="h-3.5 w-3.5" /> },
          { k: "risk", label: "Risk Rings", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
          { k: "beats", label: "Beat Micro-Grid", icon: <Activity className="h-3.5 w-3.5" /> },
          { k: "grid", label: "Predictive Grid", icon: <Sparkles className="h-3.5 w-3.5" /> },
        ] as const).map((l) => (
          <button key={l.k} onClick={() => setLayer(l.k)}
            className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition ${
              layer === l.k ? "bg-gradient-to-r from-[#008DDA] to-[#41C9E2] text-white border-transparent shadow"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#008DDA]"
            }`}>{l.icon} {l.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[520px]">
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative bg-slate-900 min-h-[520px]">
          <div ref={mapEl} className="absolute inset-0" style={{ background: "#0f172a" }} />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white text-xs font-mono z-[500] gap-2 pointer-events-none">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> Loading Karnataka geospatial layer…
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 backdrop-blur text-white p-3 rounded-lg text-[10px] font-mono border border-slate-800 space-y-1 pointer-events-none">
            <div className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3 w-3" /> Legend
            </div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#e11d48]" /> Critical</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#FFA33C]" /> Moderate</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#008DDA]" /> Baseline</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#FFA33C]" /> Station</div>
          </div>
          <div className="absolute top-4 right-4 z-[400] bg-slate-950/90 backdrop-blur text-white px-3 py-2 rounded-lg text-[10px] font-mono border border-emerald-900/60 flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </div>
        </div>

        <div className="flex flex-col gap-3 min-h-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-1 flex flex-col min-h-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b pb-2 mb-2 font-mono flex items-center gap-1">
              <Flame className="h-3 w-3 text-rose-500" /> Top Threat Districts
            </div>
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-[360px]">
              {[...(districts.data ?? [])].sort((a, b) => b.fir_count - a.fir_count).slice(0, 12).map((d, i) => {
                const intensity = d.fir_count / maxCount;
                const active = selected === d.district;
                return (
                  <button key={d.district}
                    onClick={() => { setSelected(d.district); mapRef.current?.setView([d.lat, d.lng], 9); }}
                    className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg border transition ${
                      active ? "border-[#008DDA] bg-sky-50" : "border-slate-100 hover:border-slate-300 bg-white"
                    }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 text-[10px] font-mono text-slate-400">#{i + 1}</span>
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: intensity > 0.66 ? "#e11d48" : intensity > 0.33 ? "#FFA33C" : "#008DDA" }} />
                      <span className="text-xs font-semibold text-slate-800 truncate">{d.district}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-900">{d.fir_count.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-500">victims {d.victims.toLocaleString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-800 shadow p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 pb-1 mb-2 font-mono flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Crime Signal
            </div>
            <div className="space-y-1.5">
              {(groups.data ?? []).slice(0, 5).map((g, i) => {
                const max = Math.max(1, ...(groups.data ?? []).map((x) => x.count));
                return (
                  <div key={g.crime_group}>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="truncate text-slate-200">{g.crime_group}</span>
                      <span className="text-emerald-400 font-bold">{g.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden mt-1">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${(g.count / max) * 100}%`,
                          background: `linear-gradient(90deg, #008DDA, #41C9E2, ${i === 0 ? "#e11d48" : "#FFA33C"})`,
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "sky" | "rose" | "amber" | "violet" }) {
  const map: Record<string, string> = {
    sky: "from-sky-500 to-cyan-400",
    rose: "from-rose-500 to-red-400",
    amber: "from-amber-500 to-orange-400",
    violet: "from-violet-500 to-fuchsia-400",
  };
  return (
    <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-3 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${map[tone]}`} />
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
        {icon} {label}
      </div>
      <div className="text-xl font-bold text-slate-900 mt-1 truncate">{value}</div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function popupHtml(d: District, predictive = false) {
  return `<div style="font-size:11px">
    <div style="font-weight:700">${predictive ? "🎯 " : ""}${escapeHtml(d.district)}</div>
    <div>FIRs: <b>${d.fir_count.toLocaleString()}</b></div>
    <div>Victims: <b>${d.victims.toLocaleString()}</b></div>
    ${predictive ? '<div style="color:#0891b2;margin-top:2px">Predictive priority zone</div>' : ""}
  </div>`;
}
