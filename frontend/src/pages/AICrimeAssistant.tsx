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
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useFilters } from "../lib/filters-store";
import type { ChatSession } from "../types";
import { ResponseCard } from "../components/shared/ResponseCards";
import { apiUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
  const { user } = useAuth();
  const filters = useFilters();
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem("ksp_active_session_id") || "s1";
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("ksp_chat_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load sessions from localStorage", e);
    }
    return [
      { id: "s1", title: "Show robbery cases in Bengaluru last month", pinned: true, messages: [INITIAL_MESSAGE] },
      { id: "s2", title: "Cybercrime patterns Mysuru", pinned: false, messages: [INITIAL_MESSAGE] },
    ];
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || { id: "s1", title: "New Case Thread", pinned: false, messages: [INITIAL_MESSAGE] };
  const messages = activeSession.messages || [INITIAL_MESSAGE];

  const setMessages = useCallback(
    (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
      setSessions((prevSessions) => {
        let found = false;
        const next = prevSessions.map((s) => {
          if (s.id === activeSessionId) {
            found = true;
            const updatedMsgs = typeof newMessages === "function" ? newMessages(s.messages || [INITIAL_MESSAGE]) : newMessages;
            return { ...s, messages: updatedMsgs };
          }
          return s;
        });
        if (!found) {
          const updatedMsgs = typeof newMessages === "function" ? newMessages([INITIAL_MESSAGE]) : newMessages;
          return [
            { id: activeSessionId, title: "New Case Thread", pinned: false, messages: updatedMsgs },
            ...prevSessions
          ];
        }
        return next;
      });
    },
    [activeSessionId]
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [listeningLang, setListeningLang] = useState<"kn-IN" | "en-IN">("kn-IN");
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem("ksp_active_session_id", activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem("ksp_chat_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions to localStorage", e);
    }
  }, [sessions]);

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

        // Update session title dynamically if it's currently a default
        setSessions((prevSessions) => {
          return prevSessions.map((s) => {
            if (s.id === activeSessionId && (s.title === "New Case Thread" || s.title.startsWith("New Chat") || s.title === "Show robbery cases in Bengaluru last month" || s.title === "Cybercrime patterns Mysuru")) {
              const shortTitle = v.length > 48 ? v.slice(0, 48) + "…" : v;
              return { ...s, title: shortTitle };
            }
            return s;
          });
        });
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

  const launchNewSession = () => {
    abortRef.current?.abort();
    const newId = `s_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Case Thread",
      pinned: false,
      messages: [INITIAL_MESSAGE]
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setLoading(false);
  };

  const handleExportPDF = () => {
    const activeSessionTitle = activeSession?.title || "AI Case Investigation";
    const currentDate = new Date().toLocaleDateString("en-IN", {
      dateStyle: "long"
    }) + " " + new Date().toLocaleTimeString("en-IN", { timeStyle: "short" });
    
    const officerName = user?.username || "Inspector";
    const officerBadge = user?.badgeNumber || "Badge: KSP-5590";
    const officerRole = user?.role || "Active Officer";
    
    let chatHtml = "";
    messages.forEach((msg, idx) => {
      if (idx === 0) return;
      
      const isUser = msg.role === "user";
      const sender = isUser ? "Officer Inquiry" : "Intelligence System (AI)";
      const contentClass = isUser ? "user-msg" : "ai-msg";
      
      let text = msg.content || "";
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/\n/g, '<br />');

      chatHtml += `
        <div class="message-block ${contentClass}">
          <div class="message-header">
            <span class="sender-title">${sender}</span>
            <span class="message-time">${msg.timestamp || ""}</span>
          </div>
          <div class="message-content">
            ${text}
          </div>
      `;

      if (msg.cardType === "table" && msg.cardData) {
        const headers = msg.cardData.headers || [];
        const rows = msg.cardData.rows || [];
        chatHtml += `
          <div class="report-table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${rows.map(row => `
                  <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      } else if (msg.cardType === "heatmap" && msg.cardData) {
        chatHtml += `
          <div class="meta-box font-mono">
            <strong>Geographic Hotspot Context:</strong><br/>
            Center: ${JSON.stringify(msg.cardData.center)} | Intensity: ${msg.cardData.intensity} | Patrols Recommended: ${msg.cardData.recommendedPatrols}
          </div>
        `;
      } else if (msg.cardType === "network" && msg.cardData) {
        chatHtml += `
          <div class="meta-box font-mono">
            <strong>Criminal Network Context:</strong><br/>
            Nodes: ${msg.cardData.nodes?.join(", ")}<br/>
            Relationships: ${msg.cardData.edges?.map(e => `${e[0]} to ${e[1]} (${e[2]})`).join(" | ")}
          </div>
        `;
      }

      chatHtml += `</div>`;
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>KSP Crime Intelligence Synthesis Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=JetBrains+Mono&display=swap');
            
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              background: #ffffff;
              margin: 0;
              padding: 0;
              line-height: 1.6;
              font-size: 13px;
            }
            
            /* Cover Page */
            .cover-page {
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-after: always;
              padding: 40px;
              box-sizing: border-box;
              border: 8px double #1e3e62;
            }
            
            .cover-header {
              text-align: center;
              margin-top: 40px;
            }
            
            .ksp-emblem {
              font-size: 48px;
              color: #1e3e62;
              margin-bottom: 10px;
              font-weight: 800;
              letter-spacing: 2px;
            }
            
            .cover-subtitle {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 3px;
              color: #64748b;
              font-weight: 600;
            }
            
            .cover-title-box {
              text-align: center;
              margin: auto 0;
            }
            
            .cover-title {
              font-size: 32px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.5px;
              line-height: 1.2;
              margin-bottom: 15px;
              text-transform: uppercase;
            }
            
            .cover-divider {
              width: 120px;
              height: 4px;
              background: #e11d48;
              margin: 20px auto;
            }
            
            .classification-badge {
              display: inline-block;
              border: 2px solid #e11d48;
              color: #e11d48;
              padding: 6px 16px;
              font-weight: 700;
              font-family: 'JetBrains Mono', monospace;
              letter-spacing: 3px;
              font-size: 12px;
              margin-top: 10px;
              text-transform: uppercase;
            }
            
            .cover-footer {
              margin-bottom: 40px;
              border-top: 2px solid #e2e8f0;
              padding-top: 20px;
            }
            
            .metadata-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              font-size: 11px;
              color: #475569;
            }
            
            .meta-item strong {
              color: #0f172a;
            }
            
            /* Report Content */
            .content-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            
            .content-header h2 {
              margin: 0;
              font-size: 16px;
              color: #0f172a;
              font-weight: 800;
              text-transform: uppercase;
            }
            
            .message-block {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            
            .message-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            
            .sender-title {
              font-weight: 700;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #1e3e62;
            }
            
            .message-time {
              font-size: 11px;
              color: #94a3b8;
            }
            
            .user-msg .sender-title {
              color: #475569;
            }
            
            .message-content {
              font-size: 13px;
              color: #334155;
              text-align: justify;
            }
            
            /* Table Styles */
            .report-table-wrapper {
              margin-top: 15px;
              margin-bottom: 15px;
              overflow-x: auto;
            }
            
            .report-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            
            .report-table th {
              background: #f1f5f9;
              color: #0f172a;
              font-weight: 700;
              padding: 8px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            
            .report-table td {
              padding: 8px;
              border: 1px solid #cbd5e1;
              color: #334155;
            }
            
            .report-table tr:nth-child(even) td {
              background: #f8fafc;
            }
            
            .meta-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 10px;
              border-radius: 6px;
              margin-top: 12px;
              font-size: 11px;
              color: #475569;
            }
            
            .sign-off-section {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            
            .signature-box {
              width: 200px;
              text-align: center;
              border-top: 1px solid #94a3b8;
              padding-top: 8px;
              font-size: 11px;
              color: #475569;
            }
            
            .official-stamp {
              width: 120px;
              height: 120px;
              border: 2px dashed #94a3b8;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
              transform: rotate(-15deg);
            }
            
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          
          <!-- Cover Page -->
          <div class="cover-page">
            <div class="cover-header">
              <div class="ksp-emblem">KA - POLICE</div>
              <div class="cover-subtitle">Karnataka State Police Department</div>
              <div class="cover-subtitle">State Intelligence Directorate</div>
            </div>
            
            <div class="cover-title-box">
              <div class="classification-badge">Secret // Internal Use Only</div>
              <h1 class="cover-title">Crime Intelligence Synthesis Report</h1>
              <div class="cover-subtitle" style="font-size:12px; margin-top: 10px;">Subject: ${activeSessionTitle}</div>
              <div class="cover-divider"></div>
            </div>
            
            <div class="cover-footer">
              <div class="metadata-grid">
                <div class="meta-item">
                  <strong>Prepared By:</strong><br/>
                  ${officerName} (${officerRole})<br/>
                  ${officerBadge}
                </div>
                <div class="meta-item" style="text-align: right;">
                  <strong>Date generated:</strong><br/>
                  ${currentDate}<br/>
                  <strong>Node Server Status:</strong> Secure
                </div>
              </div>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px; box-sizing: border-box;">
            <div class="content-header">
              <h2>Investigation Dossier & Query History</h2>
              <div style="font-size: 10px; color: #64748b; font-family: 'JetBrains Mono';">CASE_REF: ${activeSession?.id || "N/A"}</div>
            </div>
            
            ${chatHtml}
            
            <!-- Sign-Off Block -->
            <div class="sign-off-section">
              <div class="signature-box">
                <strong>${officerName}</strong><br/>
                Reporting Officer Signature
              </div>
              
              <div class="official-stamp">
                Official Stamp
              </div>
              
              <div class="signature-box">
                <strong>State Intelligence Board</strong><br/>
                Countersigning Authority
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = listeningLang;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (e: any) => {
      const result = e.results[0][0].transcript;
      if (result) {
        setInput((prev) => (prev ? prev + " " + result : result));
      }
    };

    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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
            onClick={launchNewSession}
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
                style={{
                  border: "1px solid transparent",
                  background: s.id === activeSessionId ? "rgba(0,141,218,0.15)" : "transparent",
                  borderColor: s.id === activeSessionId ? "rgba(0,141,218,0.3)" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (s.id !== activeSessionId) {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(30,62,98,0.5)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,141,218,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (s.id !== activeSessionId) {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
                  }
                }}
                onClick={() => {
                  abortRef.current?.abort();
                  setActiveSessionId(s.id);
                }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessions((prev) => {
                        const next = prev.filter((x) => x.id !== s.id);
                        if (activeSessionId === s.id && next.length > 0) {
                          setActiveSessionId(next[0].id);
                        }
                        return next;
                      });
                    }}
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 text-xs text-[#008DDA] hover:text-[#0069c2] px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-100 hover:bg-blue-100 transition-all font-mono font-bold"
            >
              <FileText className="h-3.5 w-3.5" /> Export PDF Report
            </button>
            <button
              onClick={launchNewSession}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all font-mono"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> New Chat
            </button>
          </div>
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
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button type="button" title="Attach" className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                <Paperclip className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setListeningLang((prev) => prev === "kn-IN" ? "en-IN" : "kn-IN")}
                  className="px-1.5 py-1 text-[9px] font-extrabold font-mono rounded bg-white border border-slate-200 text-[#008DDA] transition-all hover:bg-slate-50 active:scale-95"
                  title="Toggle Voice Input Language (Kannada / English)"
                >
                  {listeningLang === "kn-IN" ? "KN" : "EN"}
                </button>
                <button
                  type="button"
                  onClick={toggleListening}
                  title={`Voice Input (${listeningLang === "kn-IN" ? "Kannada" : "English"})`}
                  className={`p-1.5 rounded-lg transition-all ${
                    isListening
                      ? "text-red-500 bg-red-50 border border-red-200 animate-pulse"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
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
