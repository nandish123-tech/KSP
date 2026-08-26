// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserCheck, Wifi, Clock, ShieldCheck } from "lucide-react";

const TopNav: React.FC = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-10"
      style={{
        background: "linear-gradient(180deg, rgba(6,17,31,0.92) 0%, rgba(11,25,44,0.88) 100%)",
        backdropFilter: "blur(14px) saturate(130%)",
        WebkitBackdropFilter: "blur(14px) saturate(130%)",
        borderBottom: "1px solid color-mix(in oklab, var(--duty-gold) 20%, transparent)",
        boxShadow: "0 1px 14px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(214,176,96,0.08)",
      }}
    >
      {/* Left — Zone badge + live node */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "color-mix(in oklab, var(--duty-gold) 10%, transparent)",
            border: "1px solid color-mix(in oklab, var(--duty-gold) 30%, transparent)",
          }}>
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          <span className="text-[10px] font-bold text-gold-soft uppercase tracking-[0.12em] font-mono">
            Secure Intranet Zone
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.25)",
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />
          <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">
            Node Live
          </span>
        </div>
      </div>

      {/* Right — Time + user */}
      <div className="flex items-center gap-4">
        {/* Live clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "color-mix(in oklab, oklch(1 0 0) 4%, transparent)",
            border: "1px solid color-mix(in oklab, var(--duty-gold) 16%, transparent)",
          }}>
          <Clock className="h-3.5 w-3.5 text-gold" />
          <div className="text-right">
            <div className="text-[11px] font-mono font-bold text-gold-soft tabular-nums">{timeStr}</div>
            <div className="text-[9px] font-mono text-slate-400">{dateStr} IST</div>
          </div>
        </div>

        {/* Node label */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-slate-500 font-mono">{user?.badgeNumber}</p>
          <p className="text-xs font-semibold text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            State Server Node #4
          </p>
        </div>

        {/* Connectivity indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{
            background: "rgba(52,211,153,0.07)",
            border: "1px solid rgba(52,211,153,0.2)",
          }}>
          <Wifi className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[9px] font-mono text-emerald-300 font-bold uppercase">Online</span>
        </div>

        {/* Avatar */}
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--duty-gold) 30%, #1E3E62) 0%, #1E3E62 100%)",
            border: "2px solid color-mix(in oklab, var(--duty-gold) 45%, transparent)",
            boxShadow: "0 0 14px color-mix(in oklab, var(--duty-gold) 25%, transparent)",
          }}
        >
          <UserCheck className="h-4 w-4 text-gold-soft" />
        </div>
      </div>
    </header>
  );
};

export default TopNav;
