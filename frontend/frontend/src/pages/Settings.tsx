// @ts-nocheck

import { Database, Cpu, Globe } from "lucide-react";



export default function Settings() {
  return (
    <div className="p-8 space-y-6 overflow-y-auto h-[calc(100vh-4rem)] max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Parameters & Gateway Settings</h1>
        <p className="text-xs text-gray-500">
          Configure connection vectors, localization setups, and authorization levels.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y">
        <div className="p-5 flex items-start gap-4">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Language / Localization
            </h3>
            <select className="text-xs border p-2 rounded-md bg-white w-48 focus:outline-none focus:border-blue-500">
              <option>English (United Kingdom / India)</option>
              <option>ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>
        </div>

        <div className="p-5 flex items-start gap-4">
          <Database className="h-5 w-5 text-slate-700 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
              Data Source Binding
            </h3>
            <p className="text-xs text-gray-500 font-mono bg-slate-50 p-2 rounded border border-dashed">
              Connected to Supabase — 1,674,734 FIR records across 41 Karnataka districts.
            </p>
          </div>
        </div>

        <div className="p-5 flex items-start gap-4">
          <Cpu className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
              AI Gateway
            </h3>
            <p className="text-xs text-gray-500 font-mono bg-slate-50 p-2 rounded border border-dashed">
              Lovable AI Gateway → google/gemini-3-flash-preview. Live-grounded on the FIR dataset.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
