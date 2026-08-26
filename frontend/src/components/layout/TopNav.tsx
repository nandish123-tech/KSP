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
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Left — Zone badge + live node */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: "linear-gradient(135deg, rgba(0,141,218,0.1), rgba(65,201,226,0.08))",
            border: "1px solid rgba(0,141,218,0.25)",
          }}>
          <ShieldCheck className="h-3.5 w-3.5 text-[#008DDA]" />
          <span className="text-[10px] font-bold text-[#008DDA] uppercase tracking-[0.12em] font-mono">
            Secure Intranet Zone
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-live" />
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
            Node Live
          </span>
        </div>
      </div>

      {/* Right — Time + user */}
      <div className="flex items-center gap-4">
        {/* Live clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(248,250,252,0.9)", border: "1px solid rgba(226,232,240,0.8)" }}>
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <div className="text-right">
            <div className="text-[11px] font-mono font-bold text-slate-800">{timeStr}</div>
            <div className="text-[9px] font-mono text-slate-400">{dateStr} IST</div>
          </div>
        </div>

        {/* Node label */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-slate-400 font-mono">{user?.badgeNumber}</p>
          <p className="text-xs font-semibold text-slate-700" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            State Server Node #4
          </p>
        </div>

        {/* Connectivity indicator */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[9px] font-mono text-emerald-600 font-bold uppercase">Online</span>
        </div>

        {/* Avatar */}
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center shadow-md"
          style={{
            background: "linear-gradient(135deg, #1E3E62 0%, #008DDA 100%)",
            border: "2px solid rgba(0,141,218,0.4)",
            boxShadow: "0 0 12px rgba(0,141,218,0.25)",
          }}
        >
          <UserCheck className="h-4 w-4 text-white" />
        </div>
      </div>
    </header>
  );
};

export default TopNav;
