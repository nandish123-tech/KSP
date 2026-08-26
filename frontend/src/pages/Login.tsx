// @ts-nocheck
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { ShieldAlert, KeyRound, User, Eye, EyeOff, Fingerprint } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Local auth: any username + password `ksp@123`
    if (password !== "ksp@123") {
      setTimeout(() => {
        setError("Authentication failed. Hint: use password ksp@123");
        setLoading(false);
      }, 600);
      return;
    }

    const role = /admin/i.test(username)
      ? "Admin"
      : /inspector/i.test(username)
        ? "Inspector"
        : /constable/i.test(username)
          ? "Constable"
          : "Sub Inspector";

    setTimeout(() => {
      login({
        username: username || "Officer",
        role,
        token: "local-" + Date.now(),
        badgeNumber: "KSP-" + Math.floor(1000 + Math.random() * 9000),
      });
      navigate("/");
    }, 700);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #050d1a 0%, #091730 35%, #0c2240 60%, #143461 100%)",
      }}
    >
      {/* ── Background glow blobs (enhanced from Project 1) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,141,218,0.22) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(30,62,98,0.4) 0%, transparent 70%)", filter: "blur(50px)" }} />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(65,201,226,0.08) 0%, transparent 70%)", filter: "blur(30px)" }} />
      </div>

      {/* ── Subtle tech-grid overlay on background ── */}
      <div className="absolute inset-0 tech-grid-dark pointer-events-none opacity-60" />

      {/* ── Main Card ── */}
      <div
        className="relative z-10 w-full max-w-md overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: "1.25rem",
          boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,141,218,0.2), 0 0 60px rgba(0,141,218,0.08)",
          border: "1px solid rgba(30,62,98,0.4)",
        }}
      >
        {/* ── Card Header ── */}
        <div
          className="relative p-7 text-center text-white flex flex-col items-center gap-3 overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #0a1f3a 0%, #1a3a5e 50%, #1b4d84 100%)",
          }}
        >
          {/* Scan-line animation (Project 1) */}
          <div className="scan-line" />

          {/* Shield icon with glow */}
          <div className="relative">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(30,62,98,0.9), rgba(14,36,62,0.95))",
                border: "1px solid rgba(0,141,218,0.5)",
                boxShadow: "0 0 30px rgba(0,141,218,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>
            {/* Fingerprint accent */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-400/90 flex items-center justify-center"
              style={{ boxShadow: "0 0 8px rgba(251,191,36,0.5)" }}>
              <Fingerprint className="h-3 w-3 text-amber-900" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-widest font-mono">KSP CRIME INTELLIGENCE HUB</h2>
            <p className="text-xs text-slate-400 mt-1 tracking-wider">
              Law Enforcement Secure Authentication Entryway
            </p>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-4 mt-1 text-[9px] font-mono uppercase tracking-widest">
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />
              System Online
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1 text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              1,674,734 FIRs Active
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-mono">
              Officer Username / Badge Context
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g., Inspector Patil"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl transition-all focus:outline-none focus:border-[#008DDA] focus:ring-3 focus:ring-blue-100 bg-slate-50 font-mono placeholder-slate-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Enter title (Admin / Inspector / Constable) to shape your role workspace
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-mono">
              Security Core Passcode
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl transition-all focus:outline-none focus:border-[#008DDA] focus:ring-3 focus:ring-blue-100 bg-slate-50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-3 text-white font-bold text-sm rounded-xl transition-all overflow-hidden group"
            style={{
              background: loading
                ? "linear-gradient(135deg, #4a7099, #2d5a8c)"
                : "linear-gradient(135deg, #008DDA 0%, #006ac7 100%)",
              boxShadow: loading ? "none" : "0 4px 16px rgba(0,141,218,0.4)",
            }}
          >
            {/* Button shimmer */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Decrypting Token Vault…
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Establish Secure Session
                </>
              )}
            </span>
          </button>

          {/* Hint */}
          <p className="text-center text-[10px] text-slate-400 font-mono">
            Demo: any username · password{" "}
            <span className="text-[#008DDA] font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              ksp@123
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
