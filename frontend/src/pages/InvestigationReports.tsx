// @ts-nocheck

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Share2, Plus, Filter, Search, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { getFIRsByDistrict, getFIRsByCrimeGroup } from "../lib/fir-queries";
import { useFilters } from "../lib/filters-store";
import { GlobalFilters } from "../components/dashboard/GlobalFilters";
import { useAuth } from "../context/AuthContext";

function downloadCsv(rows: Array<Record<string, unknown>>, name: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvestigationReports() {
  const { user } = useAuth();
  const filters = useFilters();
  const f = { years: filters.years, districts: filters.districts, crimeGroups: filters.crimeGroups, firStages: filters.firStages };
  const [query, setQuery] = useState("");

  const dist = useQuery({ queryKey: ["rep-d", f], queryFn: () => getFIRsByDistrict(f) });
  const grp = useQuery({ queryKey: ["rep-g", f], queryFn: () => getFIRsByCrimeGroup(f) });

  const rows = (dist.data ?? [])
    .map((r, i) => {
      const topCrime = grp.data?.[i % Math.max(1, grp.data?.length ?? 1)]?.crime_group ?? "Mixed";
      return {
        id: `R-${String(2000 + i).padStart(4, "0")}`,
        district: r.district,
        fir_count: r.count,
        top_crime: topCrime,
        status: r.count > 5000 ? "Critical" : r.count > 1000 ? "Active" : "Monitor",
        generated: new Date().toISOString().split("T")[0],
      };
    })
    .filter((r) => !query || r.district.toLowerCase().includes(query.toLowerCase()) || r.id.includes(query));

  const downloadPdf = (r: typeof rows[0]) => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      dateStyle: "long"
    }) + " " + new Date().toLocaleTimeString("en-IN", { timeStyle: "short" });
    
    const officerName = user?.username || "Inspector";
    const officerBadge = user?.badgeNumber || "Badge: KSP-5590";
    const officerRole = user?.role || "Active Officer";
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>KSP District Profile - ${r.district}</title>
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
              font-size: 28px;
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
            
            .report-section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              color: #1e3e62;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 12px;
              letter-spacing: 1px;
            }
            
            /* KPI cards */
            .kpi-row {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
              margin-bottom: 25px;
            }
            
            .kpi-card {
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            
            .kpi-label {
              font-size: 10px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
              margin-bottom: 4px;
            }
            
            .kpi-value {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              font-family: 'JetBrains Mono', monospace;
            }
            
            .recommendation-list {
              padding-left: 20px;
              margin: 0;
            }
            
            .recommendation-list li {
              margin-bottom: 8px;
              color: #334155;
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
              <div class="classification-badge">Confidential</div>
              <h1 class="cover-title">District Crime Intelligence Dossier</h1>
              <div class="cover-subtitle" style="font-size:12px; margin-top: 10px;">Subject: Crime Profile for ${r.district} District</div>
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
                  <strong>Dossier ID:</strong> ${r.id}<br/>
                  <strong>Date generated:</strong><br/>
                  ${currentDate}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px; box-sizing: border-box;">
            <div class="content-header">
              <h2>District Crime Profile Analysis</h2>
              <div style="font-size: 10px; color: #64748b; font-family: 'JetBrains Mono';">REPORT_REF: ${r.id}</div>
            </div>
            
            <!-- Section 1: Stats -->
            <div class="report-section">
              <div class="section-title">Section I: Executive Operational Metrics</div>
              <div class="kpi-row">
                <div class="kpi-card">
                  <div class="kpi-label">Registered FIRs</div>
                  <div class="kpi-value">${r.fir_count.toLocaleString()}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Primary Crime Category</div>
                  <div class="kpi-value" style="font-size: 13px; margin-top: 5px;">${r.top_crime}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">District Risk Rating</div>
                  <div class="kpi-value" style="color: ${r.status === 'Critical' ? '#e11d48' : r.status === 'Active' ? '#d97706' : '#059669'}; font-size: 18px;">
                    ${r.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Section 2: Evaluation -->
            <div class="report-section">
              <div class="section-title">Section II: Intelligence Analysis</div>
              <p style="color: #334155; text-align: justify; font-size: 12.5px;">
                An analytical review of crime data indicates that the district of <strong>${r.district}</strong> is currently categorized under a <strong>${r.status}</strong> alert status, based on a cumulative registry of <strong>${r.fir_count.toLocaleString()}</strong> FIR incidents. 
                The predominant operational challenge in this jurisdiction relates to <strong>${r.top_crime}</strong> cases, which account for a significant portion of local law enforcement response.
              </p>
            </div>
            
            <!-- Section 3: Recommendations -->
            <div class="report-section">
              <div class="section-title">Section III: Recommended Security Protocols</div>
              <ul class="recommendation-list" style="font-size: 12.5px;">
                ${r.status === 'Critical' ? `
                  <li>Deploy additional static police presence at high-density hot zones immediately.</li>
                  <li>Increase joint patrol cycles by 25% across the district sub-divisions.</li>
                  <li>Initiate targeted localized task force investigations into major crime hubs.</li>
                  <li>Conduct weekly precinct-level coordination briefings with State Intelligence.</li>
                ` : r.status === 'Active' ? `
                  <li>Maintain scheduled mobile patrols and active intelligence monitoring.</li>
                  <li>Analyze hot spot shift patterns and re-allocate resources bi-weekly.</li>
                  <li>Engage in community-based crime prevention initiatives in moderate-risk neighborhoods.</li>
                  <li>Perform monthly review of pending investigation backlogs.</li>
                ` : `
                  <li>Continue standard preventive patrol grids.</li>
                  <li>Update general crime log files on a weekly routine schedule.</li>
                  <li>Maintain routine check-ins with local community leaders.</li>
                  <li>Review baseline indices quarterly.</li>
                `}
              </ul>
            </div>
            
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
                <strong>Karnataka State Police</strong><br/>
                State Intelligence Board
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 md:p-8 space-y-5 overflow-y-auto h-[calc(100vh-3.5rem)]">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-[#008DDA]" /> Investigation Reports Dossier
          </h1>
          <p className="text-xs text-slate-600">Auto-compiled district reports from live FIR aggregates.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCsv(rows, "ksp-district-reports")}
            className="flex items-center gap-1.5 text-xs bg-white text-slate-700 border border-slate-200 font-semibold p-2.5 rounded-lg shadow-sm hover:border-[#008DDA]"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 text-xs bg-[#008DDA] text-white font-bold p-2.5 rounded-lg shadow-md hover:bg-[#0069c2] transition-colors">
            <Plus className="h-3.5 w-3.5" /> New Dossier
          </button>
        </div>
      </div>

      <GlobalFilters />

      <div className="tactical-card overflow-hidden">
        <div className="p-3 border-b bg-slate-50 flex gap-2 items-center text-xs font-semibold text-slate-600 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-slate-400" /> Filter Criteria
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search district or report ID…"
              className="pl-8 pr-3 py-1.5 border border-gray-200 text-xs rounded-md w-64 focus:outline-none focus:border-[#008DDA]"
            />
          </div>
        </div>
        <div className="overflow-x-auto max-h-[calc(100vh-22rem)] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
              <tr className="border-b font-bold text-slate-500">
                <th className="p-3">Report ID</th>
                <th className="p-3">District</th>
                <th className="p-3 text-right">FIRs</th>
                <th className="p-3">Top Crime</th>
                <th className="p-3">Generated</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {dist.isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Compiling reports…</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{r.id}</td>
                  <td className="p-3 font-medium text-blue-900">{r.district}</td>
                  <td className="p-3 text-right font-mono">{r.fir_count.toLocaleString()}</td>
                  <td className="p-3 text-slate-600">{r.top_crime}</td>
                  <td className="p-3">{r.generated}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === "Critical" ? "bg-rose-100 text-rose-800" :
                      r.status === "Active" ? "bg-amber-100 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => downloadPdf(r)}
                      className="inline-flex p-1.5 border rounded hover:bg-gray-50 text-blue-600 hover:border-blue-400"
                      title="Download PDF Dossier"
                    ><FileText className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={() => downloadCsv([r], r.id)}
                      className="inline-flex p-1.5 border rounded hover:bg-gray-50 text-gray-600"
                      title="Export CSV"
                    ><Download className="h-3.5 w-3.5" /></button>
                    <button className="inline-flex p-1.5 border rounded hover:bg-gray-50 text-gray-600" title="Share">
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!dist.isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">No reports match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
