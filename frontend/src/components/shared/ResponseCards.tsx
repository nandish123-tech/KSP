import React from "react";
import { Table, Map as MapIcon, Network, Copy } from "lucide-react";

interface ResponseCardProps {
  type: "text" | "table" | "heatmap" | "network" | "stats";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({ type, data }) => {
  const [expanded, setExpanded] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  switch (type) {
    case "table": {
      const limit = 10;
      const rows = data.rows || [];
      const displayRows = expanded ? rows : rows.slice(0, limit);
      const hasMore = rows.length > limit;

      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full my-2">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <Table className="h-4 w-4 text-blue-600" /> Compiled Structured Crime Records
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded">
              Risk Level: {data.riskLevel || "High"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600">
                  {data.headers?.map((h: string, idx: number) => (
                    <th key={idx} className="p-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {displayRows.map((row: any[], rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} className="p-2.5 text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-between items-center gap-2">
            <div>
              {hasMore && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  {expanded ? "Show Less" : `Show More (${rows.length - limit} rows)`}
                </button>
              )}
            </div>
            <button
              onClick={copyToClipboard}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800 bg-gray-50 border p-1.5 px-2 rounded-lg"
            >
              <Copy className="h-3 w-3" /> Copy Data
            </button>
          </div>
        </div>
      );
    }

    case "heatmap":
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full my-2">
          <div className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2 mb-3">
            <MapIcon className="h-4 w-4 text-amber-600" /> Geographic Coordinates
          </div>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs space-y-1">
            <p>Center Coordinate: {JSON.stringify(data.center)}</p>
            <p>Hotspot Density Index: {data.intensity}</p>
            <p>Radius Context Area: {data.radius}</p>
            <p>Recommended Extra Patrols: {data.recommendedPatrols}</p>
          </div>
        </div>
      );

    case "network":
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full my-2">
          <div className="flex items-center gap-2 font-semibold text-gray-800 border-b pb-2 mb-3">
            <Network className="h-4 w-4 text-purple-600" /> Relationship Schema
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-2.5 rounded border">
              <span className="font-bold block text-gray-600 mb-1">Nodes:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                {data.nodes?.map((n: string, idx: number) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 p-2.5 rounded border">
              <span className="font-bold block text-gray-600 mb-1">Edges:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.edges?.map((e: any[], idx: number) => (
                  <li key={idx}>
                    {e[0]} → {e[1]} ({e[2]})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
