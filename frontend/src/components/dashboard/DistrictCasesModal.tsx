import React, { useEffect, useState } from "react";
import { X, ArrowLeft } from "lucide-react";
import { apiUrl } from "../../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface District {
  district: string;
  cases: number;
}

interface Station {
  station: string;
  cases: number;
}

const DistrictCasesModal: React.FC<Props> = ({ open, onClose }) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [view, setView] = useState<"districts" | "stations">("districts");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    fetch(apiUrl("/api/v1/dashboard/districts"))
      .then((res) => res.json())
      .then((data) => setDistricts(data))
      .catch(console.error)
      .finally(() => setLoading(false));

    setView("districts");
    setSelectedDistrict("");
    setStations([]);
  }, [open]);

  const loadStations = async (district: string) => {
    try {
      setLoading(true);

      const res = await fetch(
        apiUrl(
          `/api/v1/dashboard/district/${encodeURIComponent(
            district
          )}/stations`
        )
      );

      const data = await res.json();

      setStations(data);
      setSelectedDistrict(district);
      setView("stations");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">

      <div className="bg-white rounded-xl w-[900px] max-h-[80vh] overflow-hidden shadow-2xl">

        <div className="flex justify-between items-center border-b px-6 py-4">

          <div>

            {view === "stations" && (
              <button
                onClick={() => setView("districts")}
                className="flex items-center gap-2 text-blue-600 mb-2"
              >
                <ArrowLeft size={18} />
                Back
              </button>
            )}

            <h2 className="font-bold text-2xl">
              {view === "districts"
                ? "District Wise Crime Statistics"
                : `Police Stations - ${selectedDistrict}`}
            </h2>

          </div>

          <button onClick={onClose}>
            <X size={28} />
          </button>

        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">

          {loading ? (

            <p className="text-center py-10">Loading...</p>

          ) : view === "districts" ? (

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-3">District</th>

                  <th className="text-right py-3">Cases</th>

                </tr>

              </thead>

              <tbody>

                {districts.map((item) => (

                  <tr
                    key={item.district}
                    onClick={() => loadStations(item.district)}
                    className="border-b hover:bg-blue-50 cursor-pointer transition"
                  >

                    <td className="py-4 font-medium">
                      {item.district}
                    </td>

                    <td className="text-right font-bold">
                      {item.cases.toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          ) : (

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-3">Police Station</th>

                  <th className="text-right py-3">Cases</th>

                </tr>

              </thead>

              <tbody>

                {stations.map((station) => (

                  <tr
                    key={station.station}
                    className="border-b hover:bg-blue-50 cursor-pointer transition"
                  >

                    <td className="py-4">
                      {station.station}
                    </td>

                    <td className="text-right font-bold">
                      {station.cases.toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>
  );
};

export default DistrictCasesModal;