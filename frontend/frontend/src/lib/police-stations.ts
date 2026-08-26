
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
  
  let fc: PoliceStationsFC;
  try {
    // Try fetching local static file first (highly optimized and works offline/locally)
    const res = await fetch("/data/police_stations.geojson");
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    fc = (await res.json()) as PoliceStationsFC;
  } catch (err) {
    console.warn("[police-stations] Local static fetch failed, trying fallback...", err);
    const res = await fetch("https://psnbuybmaugobwsdtecx.supabase.co/storage/v1/object/public/data/police_stations.geojson");
    fc = (await res.json()) as PoliceStationsFC;
  }

  cache = fc.features.map((f) => ({
    id: f.properties.station_id,
    name: f.properties.station_name || f.properties.pol_sta_name || "PS",
    code: f.properties.kgis_ps_code || "",
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
  return cache;
}

export const KARNATAKA_CENTER: [number, number] = [15.3173, 75.7139];
