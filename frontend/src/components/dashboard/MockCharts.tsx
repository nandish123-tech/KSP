// @ts-nocheck
import React from "react";

interface ChartPlaceholderProps {
  title: string;
  type: "bar" | "line" | "pie" | "radar";
}

export const MockChart: React.FC<ChartPlaceholderProps> = ({ title, type }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col h-64 justify-between">
      <div className="font-semibold text-gray-800 border-b pb-2 text-sm tracking-wide uppercase">
        {title}
      </div>
      <div className="flex-1 flex items-center justify-center bg-slate-50 border border-dashed border-gray-200 rounded-lg my-3 relative overflow-hidden">
        <div className="absolute text-center z-10">
          <p className="text-xs font-mono text-gray-400 bg-white/90 border p-1.5 rounded shadow-sm">
            Live Chart ({type.toUpperCase()})
          </p>
        </div>
        <div className="w-full h-full flex items-end justify-around px-4 pt-10 opacity-40">
          {[60, 40, 85, 30, 95, 50, 75].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`w-8 rounded-t ${
                type === "line" ? "bg-indigo-400 border-t-2 border-indigo-600 h-1" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="text-xs text-gray-400 flex items-center justify-between">
        <span>Live Engine Context</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
};
