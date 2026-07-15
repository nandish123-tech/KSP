// @ts-nocheck

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Trash2,
  Pin,
  Search,
  Plus,
  Send,
  Paperclip,
  Mic,
  Sparkles,
  User as UserIcon,
  Bot,
  Cpu,
  RefreshCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFilters } from "../lib/filters-store";
import type { ChatSession } from "../types/ksp";
import { ResponseCard } from "../components/shared/ResponseCards";
import { apiUrl } from "../lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
  cardType?: "text" | "table" | "heatmap" | "network" | "stats";
  cardData?: any;
};

const SUGGESTED_PROMPTS = [
  "Show crime trend from 2016 to 2024",
  "Which district has the most FIRs?",
  "Show robbery and theft breakdown",
  "Arrest rate vs conviction rate analysis",
  "Top police stations by FIR count",
  "Female victim statistics breakdown",
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: `## 🛡️ KA·CRIME IQ — Karnataka Police Intelligence Engine

**System active.** I have access to **1,674,734 FIR records** from Karnataka Police (2016–2024) across all districts.

I can answer questions about:
- 📊 **Crime trends** — year-on-year, month-on-month
- 🗺️ **District & station breakdowns** — which areas have the most cases
- ⚖️ **Justice pipeline** — arrest, chargesheet, conviction rates
- 👥 **Victim demographics** — gender, age group analysis
- 🔍 **Crime category analysis** — theft, assault, fraud, cyber, etc.

> Use the **GlobalFilters** on the Dashboard to scope data by district/year before asking questions.

Try one of the suggested prompts below, or type your own query.`,
};

export default function AICrimeAssistant() {
  const filters = useFilters();
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("ksp_chat_sessions");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load sessions from localStorage", e);
    }
    return [
      { id: "s1", title: "Show robbery cases in Bengaluru last month", pinned: true },
      { id: "s2", title: "Cybercrime patterns Mysuru", pinned: false },
    ];
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("ksp_chat_messages");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load messages from localStorage", e);
    }
    return [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("ksp_chat_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions to localStorage", e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem("ksp_chat_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages to localStorage", e);
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (!loading) {
      textareaRef.current?.focus();
    }
  }, [messages, loading]);

  const handleSend = useCallback(
    async (textToSend: string) => {
      const v = textToSend.trim();
      if (!v || loading) return;
      setInput("");

      const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content: v };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const payload = {
          id: userMsg.id,
          role: "user",
          text: v,
          timestamp: new Date().toLocaleTimeString(),
        };

        const res = await fetch(apiUrl("/api/v1/chat/query"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        
        const responseMsg: Message = {
          id: data.id || `a_${Date.now()}`,
          role: "assistant",
          content: data.text || "",
          cardType: data.cardType,
          cardData: data.cardData,
        };

        setMessages((prev) => [...prev, responseMsg]);

        // Save to sessions if meaningful
        if (sessions.length < 20 && v.length > 10) {
          const shortTitle = v.length > 48 ? v.slice(0, 48) + "…" : v;
          setSessions((prev) => [
            { id: `s_${Date.now()}`, title: shortTitle, pinned: false },
            ...prev.slice(0, 18),
          ]);
        }
      } catch (err: any) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: `⚠️ **AI Gateway Error**: Failed to fetch response. Make sure the backend is running.\n\n_Details: ${err.message || err}_`,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, sessions]
  );

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([INITIAL_MESSAGE]);
    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden" style={{ background: "#f8fafc" }}>

      {/* ── Session Sidebar ── */}
      <div className="w-72 flex flex-col h-full" style={{
        background: "linear-gradient(170deg, #06111f 0%, #0b192c 65%, #132944 100%)",
        borderRight: "1px solid rgba(30,62,98,0.8)",
      }}>
        <div className="p-4 space-y-3" style={{ borderBottom: "1px solid rgba(30,62,98,0.6)" }}>
          <div className="flex items-center gap-2 px-1 pt-1">
            <Cpu className="h-3 w-3 text-[#41C9E2]" />
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Case Threads</span>
          </div>
          <button
            onClick={clearChat}
            className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(0,141,218,0.15), rgba(65,201,226,0.1))",
              border: "1px solid rgba(0,141,218,0.35)",
              color: "#41C9E2",
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Launch New Case Thread
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search threads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg focus:outline-none font-mono"
              style={{
                background: "rgba(30,62,98,0.4)",
                border: "1px solid rgba(30,62,98,0.8)",
                color: "#94a3b8",
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions
            .filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((s) => (
              <div
                key={s.id}
                className="group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(30,62,98,0.5)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,141,218,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
                }}
                onClick={() => handleSend(s.title)}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-400 truncate">{s.title}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="text-slate-500 hover:text-[#41C9E2] transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, pinned: !x.pinned } : x)); }}
                  >
                    <Pin className={`h-3 w-3 ${s.pinned ? "text-[#41C9E2]" : ""}`} />
                  </button>
                  <button
                    className="text-slate-500 hover:text-red-400 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setSessions((prev) => prev.filter((x) => x.id !== s.id)); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Active filter badge */}
        {(filters.years.length + filters.districts.length + filters.crimeGroups.length + filters.firStages.length) > 0 && (
          <div className="p-3 border-t border-slate-800/50">
            <div className="rounded-lg px-3 py-2 text-[10px] font-mono"
              style={{ background: "rgba(0,141,218,0.12)", border: "1px solid rgba(0,141,218,0.25)", color: "#41C9E2" }}>
              <div className="font-bold mb-1">⚡ Active Filters Applied</div>
              {filters.districts.length > 0 && <div className="text-slate-400">Districts: {filters.districts.join(", ")}</div>}
              {filters.years.length > 0 && <div className="text-slate-400">Years: {filters.years.join(", ")}</div>}
              {filters.crimeGroups.length > 0 && <div className="text-slate-400">Crime: {filters.crimeGroups.slice(0,2).join(", ")}{filters.crimeGroups.length > 2 ? "…" : ""}</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#008DDA] to-[#41C9E2] shadow-sm">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 font-mono">KA·CRIME IQ</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-live" />
                <span className="text-[10px] text-slate-500 font-mono">Intelligence engine online · 1,674,734 FIRs indexed</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all font-mono"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? "ml-auto flex-row-reverse max-w-[75%]" : "max-w-[85%]"}`}>
                {/* Avatar */}
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs font-bold shadow-sm flex-shrink-0 ${
                  isUser
                    ? "bg-[#008DDA] border-[#0069c2] text-white"
                    : "bg-gradient-to-br from-[#06111f] to-[#0b192c] border-[#1e3e62] text-[#FFA33C]"
                }`}>
                  {isUser ? <UserIcon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div className={`space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#008DDA] text-white rounded-tr-sm"
                      : m.error
                      ? "bg-red-50 border border-red-200 text-red-800 rounded-tl-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                  }`}
                    style={!isUser ? { boxShadow: "0 1px 8px rgba(0,0,0,0.06)" } : undefined}
                  >
                    {isUser ? (
                      m.content
                    ) : m.content === "" ? (
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                        <Sparkles className="h-3.5 w-3.5 animate-spin text-[#008DDA]" />
                        Querying intelligence database…
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none [&_table]:text-xs [&_table]:w-full [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1.5 [&_tr]:border-b [&_tr]:border-slate-100 [&_p]:my-1.5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:text-[#008DDA]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {m.cardType && m.cardType !== "text" && (
                    <div className="w-full mt-2">
                      <ResponseCard type={m.cardType} data={m.cardData} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-xs">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#06111f] to-[#0b192c] flex items-center justify-center text-[#FFA33C] border border-[#1e3e62] flex-shrink-0">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#008DDA] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#008DDA] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#008DDA] animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 font-mono ml-1">Analysing records…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompts (shown when only init message) */}
        {messages.length <= 1 && (
          <div className="px-6 py-3 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-xs border border-slate-300 bg-white hover:bg-blue-50 hover:border-[#008DDA] hover:text-[#008DDA] text-slate-600 px-3 py-1.5 rounded-full transition-all font-mono shadow-sm disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto relative border border-slate-300 focus-within:border-[#008DDA] focus-within:shadow-[0_0_0_3px_rgba(0,141,218,0.12)] rounded-xl bg-white transition-all duration-150">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Ask about crime trends, districts, victim stats, arrest rates, police stations…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              className="w-full resize-none bg-transparent p-3 text-sm focus:outline-none text-slate-800 pr-28 font-mono"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
              <button type="button" title="Attach" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <Paperclip className="h-4 w-4" />
              </button>
              <button type="button" title="Voice" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <Mic className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg text-white transition-all shadow-sm disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #008DDA, #0069c2)" }}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-1.5 text-center">
            <span className="text-[10px] text-slate-400 font-mono">Press Enter to send · Shift+Enter for new line · All data sourced from Karnataka Police FIR database</span>
          </div>
        </div>
      </div>
    </div>
  );
}
