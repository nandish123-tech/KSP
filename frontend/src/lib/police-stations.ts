
export type PoliceStation = {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
};

export type PoliceStationsFC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: {
      station_id: string;
      station_name: string;
      pol_sta_name?: string;
      kgis_ps_code?: string;
    };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

let cache: PoliceStation[] | null = null;

export async function loadPoliceStations(): Promise<PoliceStation[]> {
  if (cache) return cache;

  try {
    // Local static file (served alongside the SPA)
    const res = await fetch("/data/police_stations.geojson");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const fc = (await res.json()) as PoliceStationsFC;
    cache = fc.features.map((f) => ({
      id: f.properties.station_id,
      name: f.properties.station_name || f.properties.pol_sta_name || "PS",
      code: f.properties.kgis_ps_code || "",
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }));
  } catch (err) {
    console.warn("[police-stations] Static geojson unavailable, continuing without station markers.", err);
    cache = [];
  }

  return cache;
}

export const KARNATAKA_CENTER: [number, number] = [15.3173, 75.7139];
