import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getEmergencySummary, getEmergencyAlerts, acknowledgeAlert, generateTestCall, type EmergencyAlert } from "../lib/emergency";
import { PhoneCall, AlertTriangle, CheckCircle, Clock, ShieldAlert, PhoneMissed, MapPin, Search } from "lucide-react";

export default function EmergencyResponse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  
  // Polling every 5 seconds for real-time feel (until WebSockets are added)
  const summary = useQuery({ queryKey: ["emergency-summary"], queryFn: getEmergencySummary, refetchInterval: 5000 });
  const alerts = useQuery({ queryKey: ["emergency-alerts"], queryFn: getEmergencyAlerts, refetchInterval: 5000 });

  const ackMutation = useMutation({
    mutationFn: (id: number) => acknowledgeAlert(id, user?.username || "Unknown Officer"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["emergency-summary"] });
      setSelectedAlert(null);
    }
  });

  const generateTest = async (type: string) => {
    await generateTestCall(type);
    queryClient.invalidateQueries({ queryKey: ["emergency-alerts"] });
    queryClient.invalidateQueries({ queryKey: ["emergency-summary"] });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 h-[calc(100vh-3.5rem)] overflow-y-auto bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-rose-600" /> Emergency Response Panel
          </h1>
          <p className="text-sm text-slate-500">Monitor and respond to critical emergency calls (100/112)</p>
        </div>
        
        {/* Development Controls */}
        <div className="flex gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center px-2">Test Panel</span>
          <button onClick={() => generateTest("missed_112")} className="text-[10px] bg-white border border-rose-200 text-rose-700 px-2 py-1 rounded hover:bg-rose-100 font-bold transition">Trigger Missed 112</button>
          <button onClick={() => generateTest("answered_100")} className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 font-bold transition">Trigger Answered 100</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ShieldAlert className="text-rose-500" />} label="Critical Alerts" value={summary.data?.critical_alerts ?? "-"} tone="rose" />
        <StatCard icon={<AlertTriangle className="text-amber-500" />} label="Unacknowledged" value={summary.data?.unacknowledged ?? "-"} tone="amber" />
        <StatCard icon={<CheckCircle className="text-emerald-500" />} label="Acknowledged" value={summary.data?.acknowledged ?? "-"} tone="emerald" />
        <StatCard icon={<Clock className="text-blue-500" />} label="Today's Calls" value={summary.data?.todays_calls ?? "-"} tone="blue" />
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Active Emergency Alerts</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Polling Active
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.data?.map(alert => (
                <tr key={alert.id} className={`hover:bg-slate-50 transition ${!alert.acknowledged && alert.priority === 'CRITICAL' ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      alert.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${alert.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      {alert.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{alert.emergency_number}</td>
                  <td className="px-4 py-3">
                    {alert.call_status === 'MISSED' ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1"><PhoneMissed className="w-3.5 h-3.5" /> MISSED</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5" /> {alert.call_status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{new Date(alert.call_time).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 text-slate-500">{alert.location || 'Not Supplied'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedAlert(alert)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {alerts.data?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No emergency alerts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className={`px-6 py-4 border-b flex justify-between items-center ${
              selectedAlert.priority === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
            }`}>
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <ShieldAlert className={selectedAlert.priority === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'} />
                EMERGENCY ALERT
              </h2>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Call ID</span><span className="font-mono font-bold text-slate-800">{selectedAlert.call_reference_id}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Emergency Number</span><span className="font-bold text-slate-800 text-lg">{selectedAlert.emergency_number}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Status</span><span className="font-bold text-rose-600">{selectedAlert.call_status}</span></div>
                <div><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Time</span><span className="font-mono text-slate-800">{new Date(selectedAlert.call_time).toLocaleString()}</span></div>
                <div className="col-span-2"><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Location</span><span className="text-slate-800 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {selectedAlert.location || 'Location data not supplied by telecom interface'}</span></div>
                <div className="col-span-2"><span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Alert Status</span>
                  {selectedAlert.acknowledged ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      <CheckCircle className="w-4 h-4" /> ACKNOWLEDGED BY {selectedAlert.acknowledged_by}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200 animate-pulse">
                      <AlertTriangle className="w-4 h-4" /> UNACKNOWLEDGED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              {!selectedAlert.acknowledged && (
                <button 
                  onClick={() => ackMutation.mutate(selectedAlert.id)}
                  disabled={ackMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition disabled:opacity-50"
                >
                  {ackMutation.isPending ? "Processing..." : "ACKNOWLEDGE ALERT"}
                </button>
              )}
              <button disabled className="bg-slate-200 text-slate-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed">ASSIGN OFFICER</button>
              <button disabled className="bg-slate-200 text-slate-400 px-4 py-2 rounded-lg font-bold text-sm cursor-not-allowed">CREATE INCIDENT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: any) {
  const tones: Record<string, string> = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${tones[tone]}`}>{icon}</div>
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-black text-slate-800">{value}</div>
      </div>
    </div>
  );
}
