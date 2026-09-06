import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom GSI Danger Pin
const createHotspotIcon = (name) => {
  return L.divIcon({
    className: 'custom-hotspot-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-60"></span>
        <div class="relative w-5 h-5 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
          ⚠️
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapView({
  slopes = [],
  hotspots = [],
  corridorData = null,
  selectedSlope = null,
  onSelectSlope = () => {},
  selectedRoute = "safe",
  isSevered = false
}) {
  const defaultCenter = [27.12, 88.52]; // East Sikkim & Teesta Corridor center

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

  // Extract highway line coordinates (Leaflet expects [lat, lng])
  const nh10Coords = corridorData?.features?.find(f => f.properties.id === "nh10-main")?.geometry?.coordinates?.map(c => [c[1], c[0]]) || [];
  const bypassCoords = corridorData?.features?.find(f => f.properties.id === "nh10-bypass-lava")?.geometry?.coordinates?.map(c => [c[1], c[0]]) || [];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        {/* CartoDB Dark Matter base tiles for operations center look */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />

        {/* Elevation contour / Topo overlay */}
        <TileLayer
          attribution='&copy; OpenTopoMap'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          opacity={0.35}
          maxZoom={15}
        />

        {/* NH-10 Highway Polyline */}
        {nh10Coords.length > 0 && (
          <Polyline
            positions={nh10Coords}
            pathOptions={{
              color: isSevered ? "#ef4444" : "#38bdf8",
              weight: isSevered ? 4 : 4,
              dashArray: isSevered ? "6, 8" : undefined,
              opacity: 0.9
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="font-bold text-xs text-slate-100">National Highway 10 (Direct)</div>
                <div className="text-[11px] text-slate-400">Sevoke to Gangtok (114 km)</div>
                <div className={`text-[10px] font-mono mt-1 ${isSevered ? "text-red-400 font-bold" : "text-emerald-400"}`}>
                  {isSevered ? "⚠️ Status: BLOCKED BY SLOPES" : "✓ Status: Open"}
                </div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Safe Evacuation Bypass Polyline */}
        {bypassCoords.length > 0 && (
          <Polyline
            positions={bypassCoords}
            pathOptions={{
              color: "#10b981",
              weight: selectedRoute === "safe" ? 5 : 2.5,
              opacity: selectedRoute === "safe" ? 0.95 : 0.45
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="font-bold text-xs text-emerald-400">GeoRakshak Safe Evacuation Ridge</div>
                <div className="text-[11px] text-slate-300">Damdim - Lava - Algarah - Pakyong (142 km)</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1">✓ Safe Evacuation Corridor Active</div>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* Slope Geotechnical Risk Polygons */}
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

        {/* GSI Historical Landslide Hotspots */}
        {hotspots.map((h) => (
          <Marker
            key={h.id}
            position={[h.coordinates[1], h.coordinates[0]]}
            icon={createHotspotIcon(h.name)}
          >
            <Popup>
              <div className="p-1">
                <div className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                  GSI Historical Hazard Point
                </div>
                <div className="font-bold text-xs text-slate-100">{h.name}</div>
                <div className="text-[11px] text-slate-400">{h.location}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Lithology: <span className="text-slate-200">{h.lithology}</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">
                  Trigger: {h.historical_triggers}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapAutoCenter center={selectedSlope ? [selectedSlope.center[1], selectedSlope.center[0]] : null} />
      </MapContainer>

      {/* Map Overlay Legend */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs font-mono shadow-2xl">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">NDMA Risk Index</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-sm shadow-red-500/50"></span>
            <span className="text-slate-300">Critical (Red)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-sm shadow-orange-500/50"></span>
            <span className="text-slate-300">Watch (Orange)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300">Advisory (Yellow)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">Normal (Green)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
