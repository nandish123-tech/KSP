// @ts-nocheck
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  FolderTree,
  Map,
  Network,
  FileSpreadsheet,
  Bell,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "AI Crime Assistant", path: "/assistant", icon: MessageSquare },
  { name: "Crime Analytics", path: "/analytics", icon: BarChart3 },
  { name: "FIR Details Tree", path: "/tree", icon: FolderTree },
  { name: "Crime Hotspots", path: "/hotspots", icon: Map },
  { name: "Criminal Network", path: "/network", icon: Network },
  { name: "Investigation Reports", path: "/reports", icon: FileSpreadsheet },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "Settings", path: "/settings", icon: Settings },
] as const;

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="w-64 text-white flex flex-col h-screen sticky top-0 overflow-hidden" style={{
      background: "linear-gradient(170deg, #06111f 0%, #0b192c 42%, #132944 100%)",
      borderRight: "1px solid rgba(30,62,98,0.8)",
      boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
    }}>
      {/* Tech Grid Dark Overlay (from Project 1) */}
      <div className="absolute inset-0 pointer-events-none tech-grid-dark opacity-100" />

      {/* Top radial glow */}
      <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,141,218,0.18) 0%, transparent 70%)" }} />

      {/* Branding Header */}
      <div className="relative z-10 p-5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(30,62,98,0.9)" }}>
        <div className="relative">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1E3E62 0%, #102642 100%)", border: "1px solid rgba(0,141,218,0.35)" }}>
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          {/* Live indicator */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 status-live"
            style={{ boxShadow: "0 0 6px rgba(52,211,153,0.7)" }} />
        </div>
        <div>
          <h1 className="font-bold tracking-widest text-sm text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            KSP INTEL
          </h1>
          <p className="text-[10px] text-slate-400 tracking-wider">Gov of Karnataka</p>
        </div>
      </div>

      {/* Officer Identity Card */}
      <div className="relative z-10 mx-3 mt-3 mb-1 rounded-xl px-3 py-3"
        style={{
          background: "linear-gradient(135deg, rgba(30,62,98,0.6) 0%, rgba(8,36,68,0.7) 100%)",
          border: "1px solid rgba(0,141,218,0.2)",
          backdropFilter: "blur(8px)",
        }}>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Active Officer</div>
        <div className="font-semibold text-sm text-white truncate">{user?.username ?? "—"}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-[10px] text-amber-400 font-semibold font-mono tracking-wide">{user?.role}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto relative z-10">
        <div className="text-[9px] uppercase tracking-widest text-slate-600 font-mono px-2 pb-2 pt-1">Navigation</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                active
                  ? "text-white font-medium"
                  : "text-slate-400 hover:text-white"
              }`}
              style={active ? {
                background: "linear-gradient(135deg, rgba(0,141,218,0.28) 0%, rgba(0,105,194,0.22) 100%)",
                border: "1px solid rgba(0,141,218,0.35)",
                boxShadow: "0 2px 12px rgba(0,141,218,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
              } : {
                border: "1px solid transparent",
              }}
            >
              {/* Active left bar */}
              {active && (
                <span className="nav-active-bar absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: "linear-gradient(180deg, #41C9E2, #008DDA)" }} />
              )}

              {/* Icon container */}
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150 ${
                active
                  ? "text-[#41C9E2]"
                  : "text-slate-500 group-hover:text-[#41C9E2]"
              }`}>
                <Icon className="h-4 w-4" />
              </span>

              <span className="flex-1 text-[13px]">{item.name}</span>

              {active && (
                <ChevronRight className="h-3.5 w-3.5 text-[#41C9E2] opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="relative z-10 p-3" style={{ borderTop: "1px solid rgba(30,62,98,0.9)" }}>
        <div className="text-[9px] uppercase tracking-widest text-slate-600 font-mono px-2 pb-2">Session</div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 rounded-xl transition-all duration-150 group"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(127,29,29,0.25)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          }}
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg text-red-500">
            <LogOut className="h-4 w-4" />
          </span>
          Secure Logout
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(6,17,31,0.5), transparent)" }} />
    </aside>
  );
};

export default Sidebar;
