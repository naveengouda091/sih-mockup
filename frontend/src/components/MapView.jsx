import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, CloudRain, Satellite, Eye, MapPin, Compass } from 'lucide-react';

// Fix Leaflet default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom GSI Danger Pin with Susceptibility color coding
const createHotspotIcon = (susceptibility = "Very High") => {
  const isVeryHigh = susceptibility.toLowerCase().includes("very high");
  const isHigh = susceptibility.toLowerCase() === "high";

  const pingColor = isVeryHigh ? "bg-red-400" : isHigh ? "bg-orange-400" : "bg-amber-400";
  const badgeColor = isVeryHigh ? "bg-red-600" : isHigh ? "bg-orange-500" : "bg-amber-500";
  const iconSymbol = isVeryHigh ? "⚠️" : isHigh ? "⚡" : "●";

  return L.divIcon({
    className: 'custom-hotspot-pin',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full ${pingColor} opacity-70"></span>
        <div class="relative w-5 h-5 rounded-full ${badgeColor} border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-xl">
          ${iconSymbol}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function MapAutoCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  slopes = [],
  hotspots = [],
  corridorData = null,
  selectedSlope = null,
  onSelectSlope = () => {},
  onSelectHotspot = () => {},
  selectedRoute = "safe",
  isSevered = false,
  mapCenter = [27.12, 88.52],
  mapZoom = 11
}) {
  const [basemap, setBasemap] = useState("satellite"); // 'satellite' or 'topo'
  const [showRadar, setShowRadar] = useState(true);
  const [radarTimestamp, setRadarTimestamp] = useState(null);

  // Fetch real-time RainViewer radar frame timestamp on mount
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data?.radar?.past?.length > 0) {
          const latestFrame = data.radar.past[data.radar.past.length - 1];
          setRadarTimestamp(latestFrame.time);
        }
      })
      .catch(err => {
        console.warn("RainViewer satellite radar feed unavailable or offline:", err);
      });
  }, []);

  const getPolygonStyle = (category) => {
    switch (category) {
      case "RED":
        return { color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.55, weight: 2.5 };
      case "ORANGE":
        return { color: "#f97316", fillColor: "#f97316", fillOpacity: 0.45, weight: 2 };
      case "YELLOW":
        return { color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.35, weight: 1.5 };
      default:
        return { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.25, weight: 1.5 };
    }
  };

  // Highway features from GeoJSON
  const features = corridorData?.features || [];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        {/* Basemap 1: High-Resolution Satellite True Color */}
        {basemap === "satellite" ? (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            {/* Clear geographic place & boundary labels overlay */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
              opacity={0.8}
            />
          </>
        ) : (
          /* Basemap 2: High-Resolution Topographic Terrain */
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, USGS, NOAA'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* Live Satellite Weather Radar Precipitation Tile Overlay */}
        {showRadar && radarTimestamp && (
          <TileLayer
            attribution='&copy; <a href="https://www.rainviewer.com/">RainViewer</a> Live Radar'
            url={`https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.65}
            zIndex={50}
          />
        )}

        {/* Render All Lifeline Highway Corridors */}
        {features.map((feat) => {
          const coords = feat.geometry?.coordinates?.map(c => [c[1], c[0]]) || [];
          if (coords.length === 0) return null;

          const isMainNH10 = feat.properties.id === "nh10-main";
          const isBypass = feat.properties.id === "nh10-bypass-lava";
          
          let strokeColor = "#38bdf8"; // default cyan/blue
          let dash = undefined;
          let weight = 4;

          if (isMainNH10) {
            strokeColor = isSevered ? "#ef4444" : "#38bdf8";
            dash = isSevered ? "6, 8" : undefined;
            weight = 4.5;
          } else if (isBypass) {
            strokeColor = "#10b981";
            weight = selectedRoute === "safe" ? 5 : 2.5;
          } else if (feat.properties.id === "nh29-main") {
            strokeColor = "#ec4899"; // Nagaland lifeline purple/pink
            weight = 4;
          } else if (feat.properties.id === "nh6-main") {
            strokeColor = "#f59e0b"; // Meghalaya amber
            weight = 4;
          } else if (feat.properties.id === "nh2-main") {
            strokeColor = "#8b5cf6"; // Manipur violet
            weight = 4;
          }

          return (
            <Polyline
              key={feat.properties.id}
              positions={coords}
              pathOptions={{
                color: strokeColor,
                weight: weight,
                dashArray: dash,
                opacity: 0.9
              }}
            >
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <div className="font-bold text-xs text-slate-100">{feat.properties.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{feat.properties.criticality}</div>
                  <div className="text-[10px] font-mono text-slate-300 mt-1">
                    Length: {feat.properties.length_km} km | Elev: {feat.properties.elevation_range_m}
                  </div>
                  {isMainNH10 && (
                    <div className={`text-[10px] font-mono mt-1 font-bold ${isSevered ? "text-red-400" : "text-emerald-400"}`}>
                      {isSevered ? "⚠️ Status: SEVERED BY RISK" : "✓ Status: Open"}
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Slope Geotechnical Risk Polygons (When Active) */}
        {slopes.map((slope) => {
          const positions = slope.polygon.map(coord => [coord[1], coord[0]]);
          const style = getPolygonStyle(slope.category);
          const isSelected = selectedSlope?.slope_id === slope.slope_id;

          return (
            <Polygon
              key={slope.slope_id}
              positions={positions}
              pathOptions={{
                ...style,
                weight: isSelected ? 4 : style.weight,
                color: isSelected ? "#ffffff" : style.color
              }}
              eventHandlers={{
                click: () => onSelectSlope(slope)
              }}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <div className="font-bold text-xs text-slate-100">{slope.slope_name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Slope: {slope.slope_gradient_deg}° | FoS: {slope.factor_of_safety}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-red-400">
                    Prob: {Math.round(slope.landslide_probability * 100)}% ({slope.category})
                  </div>
                  <button
                    onClick={() => onSelectSlope(slope)}
                    className="mt-1 w-full text-[10px] py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold"
                  >
                    Inspect Geotechnical Data
                  </button>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* All GSI & ISRO Historical Landslide Hotspots */}
        {hotspots.map((h) => (
          <Marker
            key={h.id}
            position={[h.coordinates[1], h.coordinates[0]]}
            icon={createHotspotIcon(h.gsi_susceptibility)}
            eventHandlers={{
              click: () => onSelectHotspot(h)
            }}
          >
            <Popup>
              <div className="p-1 space-y-1 max-w-[240px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
                  <span className="text-[9px] font-mono text-slate-300 font-bold uppercase tracking-wider">
                    {h.id}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-black ${
                    h.gsi_susceptibility === "Very High" ? "bg-red-600/30 text-red-400 border border-red-500/40" :
                    h.gsi_susceptibility === "High" ? "bg-orange-600/30 text-orange-400 border border-orange-500/40" :
                    "bg-amber-600/30 text-amber-400 border border-amber-500/40"
                  }`}>
                    {h.gsi_susceptibility}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-100">{h.name}</div>
                <div className="text-[11px] text-slate-300">{h.location}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  State: <span className="text-slate-200">{h.state || "NER"}</span> | Corridor: <span className="text-sky-300">{h.corridor || "High-Hazard"}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Lithology: <span className="text-slate-200">{h.lithology}</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">
                  Trigger: {h.historical_triggers}
                </div>
                <button
                  onClick={() => onSelectHotspot(h)}
                  className="mt-2 w-full text-[10px] py-1 bg-sky-600 hover:bg-sky-500 rounded text-white font-bold flex items-center justify-center gap-1"
                >
                  <CloudRain className="w-3 h-3" />
                  <span>Fetch Live Satellite Weather Here</span>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapAutoCenter center={mapCenter} zoom={mapZoom} />
      </MapContainer>

      {/* Floating Map Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Basemap Switcher */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 backdrop-blur-md shadow-2xl flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setBasemap("satellite")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold ${
              basemap === "satellite"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
            title="Switch to True-Color Satellite Imagery (Esri World Imagery)"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBasemap("topo")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold ${
              basemap === "topo"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
            title="Switch to High-Resolution Topographic Terrain Map"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Topographic</span>
          </button>
        </div>

        {/* Live Satellite Rain Radar Toggle */}
        <button
          onClick={() => setShowRadar(!showRadar)}
          className={`px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-center justify-between gap-2 text-[11px] font-mono font-bold transition-all ${
            showRadar
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          title="Toggle real-time RainViewer Satellite Precipitation Radar Layer"
        >
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Satellite Radar</span>
          </div>
          <span className={`w-2 h-2 rounded-full ${showRadar ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
        </button>

        {/* Hotspot Count Counter */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-2xl flex items-center gap-2 text-[11px] font-mono text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-red-400" />
          <span>Active Hotspots:</span>
          <span className="font-bold text-white font-mono bg-red-600/30 px-1.5 py-0.5 rounded border border-red-500/30">
            {hotspots.length}
          </span>
        </div>
      </div>

      {/* Map Overlay Legend */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs font-mono shadow-2xl">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">GSI / NDMA Hazard Index</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm shadow-red-500/50"></span>
            <span className="text-slate-300">Very High (Red)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-sm shadow-orange-500/50"></span>
            <span className="text-slate-300">High (Orange)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300">Moderate (Yellow)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">Safe Ridge (Green)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
