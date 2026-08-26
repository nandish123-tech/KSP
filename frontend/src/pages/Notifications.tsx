// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import { Bell, ShieldAlert, TrendingUp, MapPin, CheckCircle2, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { getFIRsByDistrict, getFIRsByCrimeGroup, getYearlyTrend } from "../lib/fir-queries";

type Notice = {
  id: string;
  sev: "critical" | "high" | "medium" | "info";
  icon: typeof Bell;
  title: string;
  body: string;
  time: string;
  district?: string;
};

const SEV = {
  critical: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  high: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  medium: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  info: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", dot: "bg-slate-400" },
};

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium">("all");
  const [read, setRead] = useState<Set<string>>(new Set());

  const dist = useQuery({ queryKey: ["n-d"], queryFn: () => getFIRsByDistrict() });
  const grp = useQuery({ queryKey: ["n-g"], queryFn: () => getFIRsByCrimeGroup() });
  const trend = useQuery({ queryKey: ["n-t"], queryFn: () => getYearlyTrend() });

  const notices = useMemo<Notice[]>(() => {
    const items: Notice[] = [];
    (dist.data ?? []).slice(0, 3).forEach((d, i) => {
      items.push({
        id: `crit-${i}`,
        sev: "critical",
        icon: ShieldAlert,
        title: `Critical hotspot: ${d.district}`,
        body: `${d.count.toLocaleString()} FIRs recorded — deploy additional patrols and joint task force.`,
        time: `${i * 4 + 2} min ago`,
        district: d.district,
      });
    });
    (grp.data ?? []).slice(0, 4).forEach((g, i) => {
      items.push({
        id: `high-${i}`,
        sev: "high",
        icon: TrendingUp,
        title: `Spike in ${g.crime_group}`,
        body: `${g.count.toLocaleString()} cases aggregated — trend analysis suggests targeted awareness campaign.`,
        time: `${(i + 1) * 12} min ago`,
      });
    });
    (trend.data ?? []).slice(-2).forEach((t, i) => {
      items.push({
        id: `med-${i}`,
        sev: "medium",
        icon: MapPin,
        title: `Yearly digest ready (${t.year})`,
        body: `${t.total_firs.toLocaleString()} FIRs · ${t.total_arrested.toLocaleString()} arrested · ${t.total_convicted.toLocaleString()} convicted.`,
        time: `${(i + 1) * 45} min ago`,
      });
    });
    items.push({
      id: "info-1",
      sev: "info",
      icon: CheckCircle2,
      title: "Weekly briefing dispatched",
      body: "State command review scheduled for 09:00 IST tomorrow.",
      time: "3 h ago",
    });
    return items;
  }, [dist.data, grp.data, trend.data]);

  const filtered = notices.filter((n) => filter === "all" || n.sev === filter);
  const unread = notices.filter((n) => !read.has(n.id)).length;

  return (
    <div className="p-6 md:p-8 space-y-5 overflow-y-auto h-[calc(100vh-3.5rem)]">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#008DDA]" /> Alerts & Notifications
            {unread > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-mono">{unread} NEW</span>
            )}
          </h1>
          <p className="text-xs text-slate-600">AI-synthesized situational alerts from live crime telemetry.</p>
        </div>
        <button
          onClick={() => setRead(new Set(notices.map((n) => n.id)))}
          className="text-xs bg-white border border-slate-200 hover:border-[#008DDA] px-3 py-2 rounded-xl font-semibold text-slate-700 shadow-sm transition-all hover:shadow-md"
        >
          Mark all read
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "critical", "high", "medium"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold capitalize ${
              filter === k ? "bg-[#008DDA] border-[#008DDA] text-white shadow" : "bg-white border-slate-200 text-slate-600 hover:border-[#008DDA]"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((n) => {
          const s = SEV[n.sev];
          const Icon = n.icon;
          const isRead = read.has(n.id);
          return (
            <div
              key={n.id}
              className={`flex gap-4 p-4 rounded-xl border shadow-sm ${s.bg} ${s.border} ${isRead ? "opacity-60" : ""}`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.dot} text-white shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className={`font-bold text-sm ${s.text}`}>{n.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <Clock className="h-3 w-3" /> {n.time}
                  </div>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{n.body}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setRead((r) => new Set(r).add(n.id))}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-900"
                  >Acknowledge</button>
                  {n.district && (
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      {n.district}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
