// @ts-nocheck

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Network, Loader2, Search, Download, Maximize2, Minimize2,
  Compass, Grid3x3, Radar, Waves, Target, Zap, Filter, Eye, EyeOff, RotateCcw,
  Save, Bookmark, Trash2, Image as ImageIcon, Layers, Keyboard, Accessibility,
  ZoomIn, ZoomOut, Move,
} from "lucide-react";
import {
  getFIRsByYearAndCrimeGroup, getFIRsByDistrict, getFIRsByCrimeGroup,
  getTopUnits, getYearlyTrend,
} from "../lib/fir-queries";
import { useFilters } from "../lib/filters-store";
import { GlobalFilters } from "../components/dashboard/GlobalFilters";

type Kind = "district" | "crime" | "year" | "unit";
type NodeT = {
  id: string; label: string; kind: Kind;
  x: number; y: number; vx: number; vy: number;
  fx?: number | null; fy?: number | null;
  r: number; weight: number; color: string;
  community?: number;
};
type EdgeT = { s: string; t: string; w: number };

const KIND_COLOR: Record<Kind, string> = {
  district: "#22d3ee",
  crime: "#f43f5e",
  year: "#fbbf24",
  unit: "#a78bfa",
};

// High-contrast community palette (color-blind safe: Okabe-Ito derived)
const COMMUNITY_COLORS = [
  "#E69F00", "#56B4E9", "#009E73", "#F0E442",
  "#0072B2", "#D55E00", "#CC79A7", "#999999",
  "#66c2a5", "#fc8d62",
];

const LAYOUTS = ["force", "radial", "matrix"] as const;
type Layout = (typeof LAYOUTS)[number];

const W = 1200;
const H = 780;
const SAVED_VIEWS_KEY = "ksp.network.savedViews.v1";

type SavedView = {
  id: string;
  name: string;
  createdAt: number;
  layout: Layout;
  threshold: number;
  layers: Record<Kind, boolean>;
  yearWindow: number | null;
  query: string;
  showPulses: boolean;
  highContrast: boolean;
  colorByCommunity: boolean;
  filters: { years: number[]; districts: string[]; crimeGroups: string[]; firStages: string[] };
};

function loadSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || "[]"); } catch { return []; }
}
function persistSavedViews(v: SavedView[]) {
  try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

function useReducedMotion() {
  const [prm, setPrm] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrm(mq.matches);
    const on = () => setPrm(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return prm;
}

// Simple label-propagation community detection
function detectCommunities(nodes: NodeT[], edges: EdgeT[]): Map<string, number> {
  const labels = new Map<string, number>();
  nodes.forEach((n, i) => labels.set(n.id, i));
  const adj = new Map<string, Array<{ id: string; w: number }>>();
  for (const e of edges) {
    if (!adj.has(e.s)) adj.set(e.s, []);
    if (!adj.has(e.t)) adj.set(e.t, []);
    adj.get(e.s)!.push({ id: e.t, w: e.w });
    adj.get(e.t)!.push({ id: e.s, w: e.w });
  }
  const order = nodes.map((n) => n.id);
  for (let iter = 0; iter < 12; iter++) {
    // shuffle
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let changed = false;
    for (const id of order) {
      const nbs = adj.get(id) ?? [];
      if (nbs.length === 0) continue;
      const tally = new Map<number, number>();
      for (const nb of nbs) {
        const l = labels.get(nb.id)!;
        tally.set(l, (tally.get(l) ?? 0) + nb.w);
      }
      let best = labels.get(id)!, bestW = -Infinity;
      for (const [l, w] of tally) if (w > bestW) { bestW = w; best = l; }
      if (best !== labels.get(id)) { labels.set(id, best); changed = true; }
    }
    if (!changed) break;
  }
  // remap to dense ids
  const remap = new Map<number, number>();
  let next = 0;
  const out = new Map<string, number>();
  for (const [id, l] of labels) {
    if (!remap.has(l)) remap.set(l, next++);
    out.set(id, remap.get(l)!);
  }
  return out;
}

export default function CriminalNetwork() {
  const filters = useFilters();
  const f = { years: filters.years, districts: filters.districts, crimeGroups: filters.crimeGroups, firStages: filters.firStages };

  const yc = useQuery({ queryKey: ["net-yc", f], queryFn: () => getFIRsByYearAndCrimeGroup(f) });
  const d = useQuery({ queryKey: ["net-d", f], queryFn: () => getFIRsByDistrict(f) });
  const c = useQuery({ queryKey: ["net-c", f], queryFn: () => getFIRsByCrimeGroup(f) });
  const u = useQuery({ queryKey: ["net-u", f], queryFn: () => getTopUnits(f, 12) });
  const trend = useQuery({ queryKey: ["net-trend", f], queryFn: () => getYearlyTrend(f) });

  const loading = yc.isLoading || d.isLoading || c.isLoading || u.isLoading;
  const prefersReducedMotion = useReducedMotion();

  // ---------- UI state ----------
  const [layout, setLayout] = useState<Layout>("force");
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(0.15);
  const [layers, setLayers] = useState<Record<Kind, boolean>>({ district: true, crime: true, year: true, unit: true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pathAnchors, setPathAnchors] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [showPulses, setShowPulses] = useState(true);
  const [yearWindow, setYearWindow] = useState<number | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [colorByCommunity, setColorByCommunity] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => loadSavedViews());
  const [showViewsPanel, setShowViewsPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [announce, setAnnounce] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const effectivePulses = showPulses && !prefersReducedMotion;

  // ---------- Build graph ----------
  const graph = useMemo(() => {
    const topDistricts = (d.data ?? []).slice(0, 10);
    const topCrimes = (c.data ?? []).slice(0, 8);
    const topUnits = (u.data ?? []).slice(0, 10);
    const yearsAll = Array.from(new Set((yc.data ?? []).map((r) => r.year))).sort();
    const years = yearsAll.slice(-6);

    const nodes: NodeT[] = [];
    const push = (id: string, label: string, kind: Kind, weight: number) => {
      nodes.push({
        id, label, kind,
        x: W / 2 + (Math.random() - 0.5) * 200,
        y: H / 2 + (Math.random() - 0.5) * 200,
        vx: 0, vy: 0,
        r: 8 + Math.min(28, Math.log10(weight + 1) * 7),
        weight, color: KIND_COLOR[kind],
      });
    };
    if (layers.district) topDistricts.forEach((r) => push(`d:${r.district}`, r.district, "district", r.count));
    if (layers.crime) topCrimes.forEach((r) => push(`c:${r.crime_group}`, r.crime_group, "crime", r.count));
    if (layers.year) years.forEach((y) => push(`y:${y}`, String(y), "year", (yc.data ?? []).filter(r => r.year === y).reduce((s, r) => s + r.count, 0)));
    if (layers.unit) topUnits.forEach((r) => push(`u:${r.unit_name}`, r.unit_name, "unit", r.count));

    const ids = new Set(nodes.map((n) => n.id));
    const edges: EdgeT[] = [];
    for (const row of yc.data ?? []) {
      const eid1 = `y:${row.year}`, eid2 = `c:${row.crime_group}`;
      if (ids.has(eid1) && ids.has(eid2)) {
        if (yearWindow != null && row.year !== yearWindow) continue;
        edges.push({ s: eid1, t: eid2, w: Math.min(2, Math.log10(row.count + 1) * 0.5) });
      }
    }
    const totalDistrict = topDistricts.reduce((s, r) => s + r.count, 0) || 1;
    const totalCrime = topCrimes.reduce((s, r) => s + r.count, 0) || 1;
    for (const dist of topDistricts) {
      for (const crime of topCrimes) {
        const share = (dist.count / totalDistrict) * (crime.count / totalCrime);
        const w = Math.min(2, share * 40);
        if (w >= 0.05 && ids.has(`d:${dist.district}`) && ids.has(`c:${crime.crime_group}`))
          edges.push({ s: `d:${dist.district}`, t: `c:${crime.crime_group}`, w });
      }
    }
    for (const uu of topUnits) {
      if (ids.has(`u:${uu.unit_name}`) && ids.has(`d:${uu.district}`))
        edges.push({ s: `u:${uu.unit_name}`, t: `d:${uu.district}`, w: Math.min(2, Math.log10(uu.count + 1) * 0.55) });
    }
    return { nodes, edges };
  }, [yc.data, d.data, c.data, u.data, layers, yearWindow]);

  const centrality = useMemo(() => {
    const deg = new Map<string, number>();
    for (const e of graph.edges) {
      deg.set(e.s, (deg.get(e.s) ?? 0) + e.w);
      deg.set(e.t, (deg.get(e.t) ?? 0) + e.w);
    }
    return deg;
  }, [graph.edges]);

  const adjacency = useMemo(() => {
    const m = new Map<string, Array<{ id: string; w: number }>>();
    for (const e of graph.edges) {
      if (!m.has(e.s)) m.set(e.s, []);
      if (!m.has(e.t)) m.set(e.t, []);
      m.get(e.s)!.push({ id: e.t, w: e.w });
      m.get(e.t)!.push({ id: e.s, w: e.w });
    }
    return m;
  }, [graph.edges]);

  const communities = useMemo(
    () => detectCommunities(graph.nodes, graph.edges),
    [graph.nodes, graph.edges],
  );

  // ---------- Physics ----------
  const nodesRef = useRef<NodeT[]>([]);
  const [, setTick] = useState(0);
  const frameCounter = useRef(0);
  useEffect(() => {
    nodesRef.current = graph.nodes.map((n) => ({ ...n, community: communities.get(n.id) }));
    setTick((t) => t + 1);
  }, [graph.nodes, communities]);

  useEffect(() => {
    if (layout !== "force") return;
    let raf = 0;
    let alpha = 1;
    const nodes = nodesRef.current;
    const edges = graph.edges;
    const idx = new Map(nodes.map((n, i) => [n.id, i]));

    const step = () => {
      alpha *= 0.992;
      if (alpha < 0.02) alpha = 0.02;
      const k = 4200;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy + 0.01;
          const dist = Math.sqrt(dist2);
          const force = k / dist2;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          a.vx += fx * alpha; a.vy += fy * alpha;
          b.vx -= fx * alpha; b.vy -= fy * alpha;
        }
      }
      for (const e of edges) {
        const a = nodes[idx.get(e.s)!], b = nodes[idx.get(e.t)!];
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 140 - e.w * 20;
        const spring = (dist - target) * 0.03 * (0.6 + e.w * 0.4);
        const fx = (dx / dist) * spring, fy = (dy / dist) * spring;
        a.vx += fx * alpha; a.vy += fy * alpha;
        b.vx -= fx * alpha; b.vy -= fy * alpha;
      }
      for (const n of nodes) {
        n.vx += (W / 2 - n.x) * 0.002 * alpha;
        n.vy += (H / 2 - n.y) * 0.002 * alpha;
        n.vx *= 0.85; n.vy *= 0.85;
        if (n.fx != null) { n.x = n.fx; n.vx = 0; }
        else n.x += n.vx;
        if (n.fy != null) { n.y = n.fy; n.vy = 0; }
        else n.y += n.vy;
        n.x = Math.max(40, Math.min(W - 40, n.x));
        n.y = Math.max(40, Math.min(H - 40, n.y));
      }
      // Throttle React re-render to every 2nd frame (or 4th if reduced motion)
      frameCounter.current = (frameCounter.current + 1) % (prefersReducedMotion ? 6 : 2);
      if (frameCounter.current === 0) setTick((t) => (t + 1) & 0xffff);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [layout, graph.edges, graph.nodes.length, prefersReducedMotion]);

  useEffect(() => {
    if (layout === "force") return;
    const nodes = nodesRef.current;
    if (layout === "radial") {
      const groups: Record<Kind, NodeT[]> = { district: [], crime: [], year: [], unit: [] };
      nodes.forEach((n) => groups[n.kind].push(n));
      const rings: Record<Kind, number> = { crime: 90, district: 220, unit: 300, year: 360 };
      (Object.keys(groups) as Kind[]).forEach((k) => {
        const arr = groups[k]; const R = rings[k];
        arr.forEach((n, i) => {
          const a = (i / Math.max(1, arr.length)) * Math.PI * 2;
          n.x = W / 2 + R * Math.cos(a); n.y = H / 2 + R * Math.sin(a);
          n.vx = 0; n.vy = 0;
        });
      });
    } else if (layout === "matrix") {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const cellW = (W - 80) / cols, cellH = (H - 80) / Math.ceil(nodes.length / cols);
      nodes.forEach((n, i) => {
        n.x = 40 + (i % cols) * cellW + cellW / 2;
        n.y = 40 + Math.floor(i / cols) * cellH + cellH / 2;
        n.vx = 0; n.vy = 0;
      });
    }
    setTick((t) => t + 1);
  }, [layout, graph.nodes.length]);

  // ---------- Zoom / pan ----------
  const svgPt = (evt: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((z) => Math.max(0.3, Math.min(4, z * factor)));
  };
  const panDragRef = useRef<{ active: boolean; sx: number; sy: number; px: number; py: number }>({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const onBgPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).tagName !== "svg" && !(e.target as Element).classList.contains("bg-hit")) return;
    panDragRef.current = { active: true, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelectedId(null);
  };

  // ---------- Node interactions ----------
  const dragRef = useRef<{ id: string | null; ox: number; oy: number }>({ id: null, ox: 0, oy: 0 });
  const onPointerDownNode = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const p = svgPt(e);
    const n = nodesRef.current.find((x) => x.id === id);
    if (!n) return;
    if (e.shiftKey) {
      setPathAnchors((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2)));
      return;
    }
    n.fx = n.x; n.fy = n.y;
    dragRef.current = { id, ox: p.x - n.x, oy: p.y - n.y };
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelectedId(id);
    setAnnounce(`Selected ${n.label}, ${n.kind}, weight ${n.weight}`);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (panDragRef.current.active) {
      setPan({ x: panDragRef.current.px + (e.clientX - panDragRef.current.sx), y: panDragRef.current.py + (e.clientY - panDragRef.current.sy) });
      return;
    }
    if (!dragRef.current.id) return;
    const p = svgPt(e);
    const n = nodesRef.current.find((x) => x.id === dragRef.current.id);
    if (!n) return;
    n.fx = p.x - dragRef.current.ox;
    n.fy = p.y - dragRef.current.oy;
    n.x = n.fx; n.y = n.fy;
    setTick((t) => (t + 1) & 0xffff);
  };
  const onPointerUp = () => {
    if (dragRef.current.id) {
      const n = nodesRef.current.find((x) => x.id === dragRef.current.id);
      if (n) { n.fx = null; n.fy = null; }
    }
    dragRef.current = { id: null, ox: 0, oy: 0 };
    panDragRef.current.active = false;
  };

  // ---------- Shortest path ----------
  const pathIds = useMemo(() => {
    if (pathAnchors.length !== 2) return new Set<string>();
    const [start, end] = pathAnchors;
    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const visited = new Set<string>();
    nodesRef.current.forEach((n) => { dist.set(n.id, Infinity); prev.set(n.id, null); });
    dist.set(start, 0);
    while (visited.size < nodesRef.current.length) {
      let u: string | null = null; let best = Infinity;
      for (const [id, dd] of dist) if (!visited.has(id) && dd < best) { best = dd; u = id; }
      if (!u || best === Infinity) break;
      if (u === end) break;
      visited.add(u);
      for (const nb of adjacency.get(u) ?? []) {
        const alt = best + 1 / Math.max(0.1, nb.w);
        if (alt < (dist.get(nb.id) ?? Infinity)) { dist.set(nb.id, alt); prev.set(nb.id, u); }
      }
    }
    const set = new Set<string>();
    let cur: string | null = end;
    while (cur) { set.add(cur); cur = prev.get(cur) ?? null; }
    return set;
  }, [pathAnchors, adjacency]);

  const focusId = selectedId ?? hoverId;
  const focusNeighbors = useMemo(() => {
    if (!focusId) return new Set<string>();
    return new Set((adjacency.get(focusId) ?? []).map((n) => n.id).concat(focusId));
  }, [focusId, adjacency]);

  const matchesQuery = useCallback(
    (n: NodeT) => query.trim() === "" || n.label.toLowerCase().includes(query.toLowerCase()),
    [query],
  );

  const now = nodesRef.current;
  const nodeById = new Map(now.map((n) => [n.id, n]));
  const filteredEdges = graph.edges.filter((e) => e.w >= threshold);

  const nodeColor = useCallback((n: NodeT) => {
    if (colorByCommunity && n.community != null) return COMMUNITY_COLORS[n.community % COMMUNITY_COLORS.length];
    return n.color;
  }, [colorByCommunity]);

  const topCentral = useMemo(() => {
    return Array.from(centrality.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, val]) => ({ id, val, node: nodeById.get(id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centrality, now]);

  const availableYears = useMemo(() => (trend.data ?? []).map((r) => r.year).sort(), [trend.data]);

  // ---------- Export ----------
  const exportSVG = () => {
    const svg = svgRef.current; if (!svg) return;
    const src = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0"?>${src}`], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `criminal-network-${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(url);
  };
  const exportPNG = async () => {
    const svg = svgRef.current; if (!svg) return;
    const src = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = W * 2; canvas.height = H * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#050818";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u; a.download = `criminal-network-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(u);
      }, "image/png");
    };
    img.src = url;
  };

  const resetSim = () => {
    nodesRef.current = graph.nodes.map((n) => ({ ...n, community: communities.get(n.id) }));
    setPathAnchors([]); setSelectedId(null);
    setZoom(1); setPan({ x: 0, y: 0 });
    setTick((t) => t + 1);
  };

  // ---------- Saved views ----------
  const saveCurrentView = () => {
    const name = window.prompt("Name this view", `View ${savedViews.length + 1}`);
    if (!name) return;
    const view: SavedView = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      name, createdAt: Date.now(),
      layout, threshold, layers: { ...layers }, yearWindow, query,
      showPulses, highContrast, colorByCommunity,
      filters: { years: [...filters.years], districts: [...filters.districts], crimeGroups: [...filters.crimeGroups], firStages: [...filters.firStages] },
    };
    const next = [view, ...savedViews].slice(0, 20);
    setSavedViews(next); persistSavedViews(next);
    setAnnounce(`Saved view ${name}`);
  };
  const applyView = (v: SavedView) => {
    setLayout(v.layout); setThreshold(v.threshold); setLayers(v.layers);
    setYearWindow(v.yearWindow); setQuery(v.query); setShowPulses(v.showPulses);
    setHighContrast(v.highContrast); setColorByCommunity(v.colorByCommunity);
    filters.set({ years: v.filters.years, districts: v.filters.districts, crimeGroups: v.filters.crimeGroups, firStages: v.filters.firStages });
    setAnnounce(`Applied view ${v.name}`);
  };
  const deleteView = (id: string) => {
    const next = savedViews.filter((v) => v.id !== id);
    setSavedViews(next); persistSavedViews(next);
  };

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "Escape") { setSelectedId(null); setPathAnchors([]); setShowHelp(false); }
      else if (e.key === "f") setFullscreen((s) => !s);
      else if (e.key === "r") resetSim();
      else if (e.key === "p") setShowPulses((s) => !s);
      else if (e.key === "c") setColorByCommunity((s) => !s);
      else if (e.key === "h") setHighContrast((s) => !s);
      else if (e.key === "?") setShowHelp((s) => !s);
      else if (e.key === "+") setZoom((z) => Math.min(4, z * 1.15));
      else if (e.key === "-") setZoom((z) => Math.max(0.3, z / 1.15));
      else if (e.key === "1") setLayout("force");
      else if (e.key === "2") setLayout("radial");
      else if (e.key === "3") setLayout("matrix");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph.nodes]);

  // Sorted list for keyboard-accessible node list
  const accessibleNodeList = useMemo(
    () => [...now].sort((a, b) => (centrality.get(b.id) ?? 0) - (centrality.get(a.id) ?? 0)),
    [now, centrality],
  );

  const bgClass = highContrast
    ? "bg-black"
    : "bg-gradient-to-br from-[#050818] via-[#0a1224] to-[#0b0f22]";
  const labelColor = highContrast ? "#ffffff" : "#e2e8f0";
  const labelSize = highContrast ? 12 : 10.5;

  return (
    <div ref={wrapRef} className={`p-4 md:p-6 space-y-3 flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-slate-950" : "h-[calc(100vh-3.5rem)]"}`}>
      {/* SR live region */}
      <div aria-live="polite" className="sr-only">{announce}</div>

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${fullscreen ? "text-white" : "text-slate-900"}`}>
            <Network className="h-6 w-6 text-fuchsia-500" aria-hidden />
            Criminal Network Intelligence Graph
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" aria-label="live data">LIVE</span>
          </h1>
          <p className={`text-xs ${fullscreen ? "text-slate-400" : "text-slate-600"}`}>
            Bound to global filters · Shift-click 2 nodes to trace a path · Press <kbd className="px-1 border rounded">?</kbd> for shortcuts
          </p>
        </div>
        <div className="flex gap-2 text-[11px] font-mono flex-wrap" role="group" aria-label="Toggle layers">
          {(Object.keys(KIND_COLOR) as Kind[]).map((k) => (
            <button key={k} onClick={() => setLayers((s) => ({ ...s, [k]: !s[k] }))}
              aria-pressed={layers[k]}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${layers[k] ? "bg-slate-900 text-white border-slate-700" : "bg-slate-100 text-slate-400 border-slate-200 line-through"}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} aria-hidden />
              {k}
              {layers[k] ? <Eye className="w-3 h-3" aria-hidden /> : <EyeOff className="w-3 h-3" aria-hidden />}
            </button>
          ))}
        </div>
      </div>

      {/* GLOBAL FILTERS (linked) */}
      {!fullscreen && <GlobalFilters />}

      {/* CONTROL BAR */}
      <div className="flex items-center gap-2 flex-wrap bg-white border border-slate-200 rounded-xl p-2 shadow-sm" role="toolbar" aria-label="Graph controls">
        <label className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg focus-within:ring-2 focus-within:ring-fuchsia-500">
          <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden />
          <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search node… (/)"
            aria-label="Search nodes"
            className="bg-transparent outline-none text-xs w-36" />
        </label>
        <div className="flex bg-slate-100 rounded-lg overflow-hidden" role="group" aria-label="Layout">
          {LAYOUTS.map((l) => (
            <button key={l} onClick={() => setLayout(l)}
              aria-pressed={layout === l}
              className={`px-2.5 py-1 text-[11px] font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${layout === l ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"}`}>
              {l === "force" && <Waves className="w-3 h-3" aria-hidden />}
              {l === "radial" && <Radar className="w-3 h-3" aria-hidden />}
              {l === "matrix" && <Grid3x3 className="w-3 h-3" aria-hidden />}
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <Filter className="w-3 h-3" aria-hidden />
          <span>edge≥{threshold.toFixed(2)}</span>
          <input type="range" min={0} max={2} step={0.05} value={threshold}
            aria-label="Edge weight threshold"
            onChange={(e) => setThreshold(Number(e.target.value))} className="w-24 accent-fuchsia-600" />
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <Compass className="w-3 h-3" aria-hidden /> Year:
          <select value={yearWindow ?? ""} onChange={(e) => setYearWindow(e.target.value ? Number(e.target.value) : null)}
            aria-label="Year window"
            className="bg-slate-100 rounded px-1.5 py-0.5 text-xs">
            <option value="">All</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <button onClick={() => setShowPulses((s) => !s)} aria-pressed={showPulses}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${effectivePulses ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
          <Zap className="w-3 h-3" aria-hidden /> pulses
        </button>
        <button onClick={() => setColorByCommunity((s) => !s)} aria-pressed={colorByCommunity}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${colorByCommunity ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
          <Layers className="w-3 h-3" aria-hidden /> communities
        </button>
        <button onClick={() => setHighContrast((s) => !s)} aria-pressed={highContrast}
          title="High contrast"
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] border focus:outline-none focus:ring-2 focus:ring-fuchsia-500 ${highContrast ? "bg-yellow-50 text-yellow-800 border-yellow-300" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
          <Accessibility className="w-3 h-3" aria-hidden /> HC
        </button>
        <div className="flex items-center gap-1 bg-slate-100 rounded" role="group" aria-label="Zoom">
          <button onClick={() => setZoom((z) => Math.max(0.3, z / 1.15))} className="px-1.5 py-1 hover:bg-slate-200" aria-label="Zoom out"><ZoomOut className="w-3 h-3" /></button>
          <span className="text-[10px] font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(4, z * 1.15))} className="px-1.5 py-1 hover:bg-slate-200" aria-label="Zoom in"><ZoomIn className="w-3 h-3" /></button>
        </div>
        <button onClick={resetSim} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
          <RotateCcw className="w-3 h-3" aria-hidden /> reset
        </button>
        <button onClick={saveCurrentView} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <Save className="w-3 h-3" aria-hidden /> save view
        </button>
        <button onClick={() => setShowViewsPanel((s) => !s)} aria-pressed={showViewsPanel}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
          <Bookmark className="w-3 h-3" aria-hidden /> views ({savedViews.length})
        </button>
        <button onClick={exportSVG} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
          <Download className="w-3 h-3" aria-hidden /> SVG
        </button>
        <button onClick={exportPNG} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
          <ImageIcon className="w-3 h-3" aria-hidden /> PNG
        </button>
        <button onClick={() => setShowHelp((s) => !s)} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500" aria-label="Keyboard shortcuts">
          <Keyboard className="w-3 h-3" aria-hidden />
        </button>
        <button onClick={() => setFullscreen((s) => !s)} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500" aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
          {fullscreen ? <Minimize2 className="w-3 h-3" aria-hidden /> : <Maximize2 className="w-3 h-3" aria-hidden />}
        </button>
        <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-slate-500">
          <span>N:<b className="text-slate-800">{now.length}</b></span>
          <span>E:<b className="text-slate-800">{filteredEdges.length}</b></span>
          <span>path:<b className={pathIds.size > 1 ? "text-emerald-600" : "text-slate-400"}>{pathIds.size > 1 ? pathIds.size : "—"}</b></span>
          {prefersReducedMotion && <span className="text-amber-600">reduced-motion</span>}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3 min-h-0">
        {/* CANVAS */}
        <div className={`relative ${bgClass} border border-slate-800 rounded-2xl overflow-hidden shadow-2xl`}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[linear-gradient(to_right,#41C9E2_1px,transparent_1px),linear-gradient(to_bottom,#41C9E2_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />
          {loading && (
            <div className="absolute top-4 left-4 flex items-center gap-2 text-emerald-400 text-xs font-mono z-10">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Computing graph topology…
            </div>
          )}
          <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-emerald-300 flex items-center gap-2">
            <Target className="w-3 h-3" aria-hidden /> {layout.toUpperCase()} · z{zoom.toFixed(2)}
          </div>
          <div className="absolute top-3 left-3 z-10 text-[10px] font-mono text-slate-400 flex items-center gap-1 bg-black/30 rounded px-2 py-1">
            <Move className="w-3 h-3" aria-hidden /> drag bg to pan · wheel to zoom
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full touch-none"
            role="application"
            aria-label="Criminal network graph. Use tab and enter to focus nodes."
            onWheel={onWheel}
            onPointerDown={onBgPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <radialGradient id="node-glow">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <filter id="soft-blur"><feGaussianBlur stdDeviation="1.5" /></filter>
            </defs>

            {/* invisible pan hit-box */}
            <rect className="bg-hit" x={0} y={0} width={W} height={H} fill="transparent" />

            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`} transform-origin={`${W / 2} ${H / 2}`}>
              {/* EDGES */}
              <g>
                {filteredEdges.map((e, i) => {
                  const s = nodeById.get(e.s), t = nodeById.get(e.t);
                  if (!s || !t) return null;
                  const inPath = pathIds.has(s.id) && pathIds.has(t.id);
                  const dim = focusId && !(focusNeighbors.has(s.id) && focusNeighbors.has(t.id));
                  const strokeOpacity = inPath ? 0.95 : dim ? 0.05 : 0.25 + e.w * 0.25;
                  const color = inPath ? "#22c55e" : nodeColor(s);
                  return (
                    <line key={i}
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke={color}
                      strokeOpacity={strokeOpacity}
                      strokeWidth={inPath ? 2.5 : 0.6 + e.w * 1.6}
                    />
                  );
                })}
              </g>

              {/* Animated pulses */}
              {effectivePulses && filteredEdges.slice(0, 45).map((e, i) => {
                const s = nodeById.get(e.s), t = nodeById.get(e.t);
                if (!s || !t) return null;
                if (focusId && !(focusNeighbors.has(s.id) && focusNeighbors.has(t.id))) return null;
                const dur = (2.2 + (i % 5) * 0.4).toFixed(1);
                return (
                  <circle key={`p${i}`} r={2.2 + e.w} fill={nodeColor(t)} opacity={0.9}>
                    <animateMotion dur={`${dur}s`} repeatCount="indefinite"
                      path={`M ${s.x} ${s.y} L ${t.x} ${t.y}`} />
                    <animate attributeName="opacity" values="0;1;0" dur={`${dur}s`} repeatCount="indefinite" />
                  </circle>
                );
              })}

              {/* NODES */}
              <g>
                {now.map((n) => {
                  const isFocus = n.id === focusId;
                  const inEgo = focusNeighbors.has(n.id);
                  const dim = focusId && !inEgo;
                  const anchor = pathAnchors.includes(n.id);
                  const match = matchesQuery(n);
                  const opacity = !match ? 0.15 : dim ? 0.25 : 1;
                  const cent = centrality.get(n.id) ?? 0;
                  const glowR = n.r + 10 + (isFocus ? 12 : 0);
                  const fill = nodeColor(n);
                  return (
                    <g key={n.id} opacity={opacity}
                      onPointerDown={(e) => onPointerDownNode(e, n.id)}
                      onPointerEnter={() => setHoverId(n.id)}
                      onPointerLeave={() => setHoverId(null)}
                      style={{ cursor: "grab" }}
                      role="button"
                      aria-label={`${n.label}, ${n.kind}, weight ${n.weight}`}>
                      <circle cx={n.x} cy={n.y} r={glowR} fill={fill} opacity={0.18} filter="url(#soft-blur)" />
                      <circle cx={n.x} cy={n.y} r={n.r + 3} fill="url(#node-glow)" />
                      {anchor && (
                        <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke="#22c55e" strokeWidth={2}>
                          {!prefersReducedMotion && <animate attributeName="r" values={`${n.r + 6};${n.r + 12};${n.r + 6}`} dur="1.6s" repeatCount="indefinite" />}
                          {!prefersReducedMotion && <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />}
                        </circle>
                      )}
                      <circle cx={n.x} cy={n.y} r={n.r} fill={fill}
                        stroke={isFocus ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth={isFocus ? 2.5 : 1.2} />
                      {cent > 0 && (
                        <circle cx={n.x + n.r * 0.7} cy={n.y - n.r * 0.7} r={4} fill="#f8fafc" stroke={fill} strokeWidth={1.5} />
                      )}
                      <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fill={labelColor} fontSize={labelSize} fontFamily="ui-monospace, monospace" pointerEvents="none">
                        {n.label.length > 20 ? n.label.slice(0, 18) + "…" : n.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* MINIMAP */}
          <div className="absolute bottom-3 right-3 w-40 h-24 bg-black/40 backdrop-blur border border-white/10 rounded overflow-hidden z-10" aria-hidden>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
              {filteredEdges.map((e, i) => {
                const s = nodeById.get(e.s), t = nodeById.get(e.t);
                if (!s || !t) return null;
                return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#64748b" strokeOpacity={0.4} strokeWidth={1} />;
              })}
              {now.map((n) => (
                <circle key={n.id} cx={n.x} cy={n.y} r={Math.max(4, n.r * 0.5)} fill={nodeColor(n)} opacity={0.85} />
              ))}
            </svg>
          </div>

          {/* Hover tooltip */}
          {hoverId && (() => {
            const n = nodeById.get(hoverId); if (!n) return null;
            const cent = (centrality.get(n.id) ?? 0).toFixed(2);
            const deg = (adjacency.get(n.id) ?? []).length;
            return (
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white font-mono z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: nodeColor(n) }} />
                  <b>{n.label}</b>
                  <span className="text-slate-400">/{n.kind}</span>
                  {n.community != null && <span className="text-indigo-300">·c{n.community}</span>}
                </div>
                <div className="text-slate-300">weight: <b className="text-white">{n.weight.toLocaleString()}</b></div>
                <div className="text-slate-300">degree: <b className="text-white">{deg}</b> · centrality: <b className="text-white">{cent}</b></div>
              </div>
            );
          })()}

          {/* Help overlay */}
          {showHelp && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
              <div className="bg-white rounded-xl p-5 max-w-md text-xs shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-sm mb-2 flex items-center gap-1"><Keyboard className="w-4 h-4" /> Keyboard shortcuts</h3>
                <ul className="grid grid-cols-2 gap-y-1 font-mono">
                  <li><kbd>/</kbd> focus search</li>
                  <li><kbd>Esc</kbd> clear selection</li>
                  <li><kbd>1/2/3</kbd> layout</li>
                  <li><kbd>+ / -</kbd> zoom</li>
                  <li><kbd>f</kbd> fullscreen</li>
                  <li><kbd>p</kbd> pulses</li>
                  <li><kbd>c</kbd> communities</li>
                  <li><kbd>h</kbd> high contrast</li>
                  <li><kbd>r</kbd> reset</li>
                  <li><kbd>?</kbd> this help</li>
                </ul>
                <button onClick={() => setShowHelp(false)} className="mt-3 text-[11px] bg-slate-900 text-white px-3 py-1 rounded">Close</button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-3 min-h-0 overflow-auto">
          {/* Saved views */}
          {showViewsPanel && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2 flex items-center gap-1">
                <Bookmark className="w-3 h-3" /> Saved Views
              </div>
              {savedViews.length === 0 ? (
                <div className="text-xs text-slate-500">No saved views yet. Click "save view" to capture the current graph.</div>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-auto">
                  {savedViews.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 text-[11px] bg-slate-50 rounded px-2 py-1.5">
                      <button className="flex-1 text-left truncate hover:text-fuchsia-700" onClick={() => applyView(v)}>
                        <b>{v.name}</b>
                        <span className="ml-1 text-slate-400 font-mono">{v.layout}</span>
                      </button>
                      <button onClick={() => deleteView(v.id)} className="p-1 hover:text-rose-600" aria-label={`Delete ${v.name}`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Detail card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">Selection</div>
            {selectedId ? (() => {
              const n = nodeById.get(selectedId); if (!n) return null;
              const neighbors = (adjacency.get(n.id) ?? []).sort((a, b) => b.w - a.w).slice(0, 6);
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: nodeColor(n) }} />
                    <b className="text-slate-900 text-sm">{n.label}</b>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{n.kind}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <Stat label="Weight" value={n.weight.toLocaleString()} />
                    <Stat label="Degree" value={String(neighbors.length)} />
                    <Stat label="Centrality" value={(centrality.get(n.id) ?? 0).toFixed(2)} />
                    <Stat label="Community" value={n.community != null ? `#${n.community}` : "—"} />
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">Top links</div>
                  <ul className="mt-1 space-y-1">
                    {neighbors.map((nb) => {
                      const nn = nodeById.get(nb.id);
                      return (
                        <li key={nb.id} className="flex items-center justify-between text-[11px]">
                          <button onClick={() => setSelectedId(nb.id)} className="flex items-center gap-1.5 truncate hover:text-fuchsia-700">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: nn ? nodeColor(nn) : "#999" }} />
                            <span className="truncate">{nn?.label ?? nb.id}</span>
                          </button>
                          <span className="font-mono text-slate-500">{nb.w.toFixed(2)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              );
            })() : (
              <div className="text-xs text-slate-500">Click a node to inspect. Shift-click 2 nodes to trace the shortest criminal path.</div>
            )}
          </div>

          {/* Centrality leaderboard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" /> Most Influential
            </div>
            <ol className="space-y-1.5">
              {topCentral.map((cc, i) => (
                <li key={cc.id}>
                  <button onClick={() => setSelectedId(cc.id)}
                    className="w-full flex items-center gap-2 text-[11px] hover:bg-slate-50 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                    <span className="font-mono text-slate-400 w-4">{i + 1}</span>
                    <span className="w-2 h-2 rounded-full" style={{ background: cc.node ? nodeColor(cc.node) : "#999" }} />
                    <span className="flex-1 truncate text-left">{cc.node?.label ?? cc.id}</span>
                    <span className="font-mono text-slate-600">{cc.val.toFixed(1)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* Keyboard-accessible node list (screen readers + tab nav) */}
          <details className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <summary className="text-[10px] uppercase tracking-widest text-slate-500 font-mono cursor-pointer">Accessible node list ({accessibleNodeList.length})</summary>
            <ul className="mt-2 max-h-56 overflow-auto space-y-0.5">
              {accessibleNodeList.map((n) => (
                <li key={n.id}>
                  <button onClick={() => setSelectedId(n.id)}
                    className="w-full flex items-center gap-2 text-[11px] hover:bg-slate-50 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                    <span className="w-2 h-2 rounded-full" style={{ background: nodeColor(n) }} />
                    <span className="flex-1 truncate text-left">{n.label}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{n.kind}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>

          {/* Path panel */}
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-2xl p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-mono mb-1 flex items-center gap-1">
              <Compass className="w-3 h-3" /> Path Trace
            </div>
            {pathAnchors.length === 0 && <div className="text-xs text-slate-500">Shift-click any two nodes.</div>}
            {pathAnchors.length === 1 && <div className="text-xs text-slate-600">Anchor: <b>{nodeById.get(pathAnchors[0])?.label}</b> — pick a target.</div>}
            {pathAnchors.length === 2 && (
              <div className="text-xs text-slate-700">
                <div className="mb-1">
                  <b>{nodeById.get(pathAnchors[0])?.label}</b> → <b>{nodeById.get(pathAnchors[1])?.label}</b>
                </div>
                <div className="font-mono text-emerald-700">{pathIds.size > 1 ? `${pathIds.size - 1} hop(s) · ${pathIds.size} nodes` : "no path"}</div>
                <button onClick={() => setPathAnchors([])}
                  className="mt-2 text-[10px] px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-700">clear</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">{label}</div>
      <div className="text-sm font-semibold text-slate-900 font-mono">{value}</div>
    </div>
  );
}
