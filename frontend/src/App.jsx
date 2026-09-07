import React, { useState, useEffect } from 'react';
import { 
  Mountain, 
  CloudRain, 
  Radio, 
  Bell, 
  Globe,
  LocateFixed
} from 'lucide-react';

import MapView from './components/MapView';
import CloudburstSlider from './components/CloudburstSlider';
import SlopeInspector from './components/SlopeInspector';
import HotspotInspector from './components/HotspotInspector';
import EvacuationRouter from './components/EvacuationRouter';
import AlertModal from './components/AlertModal';
import FallbackBadge from './components/FallbackBadge';

const API_BASE = "http://localhost:8000";

const DEFAULT_REGIONS = [
  { id: "all", name: "🌐 All NER & Pan-India Hotspots", center: [26.20, 92.20], zoom: 7 },
  { id: "sikkim", name: "🏔️ Sikkim NH-10 (AH 10) Corridor", center: [27.12, 88.52], zoom: 11 },
  { id: "nagaland", name: "🚗 Nagaland NH-29 Lifeline", center: [25.75, 93.95], zoom: 10 },
  { id: "meghalaya", name: "🌧️ Meghalaya NH-6 Lifeline", center: [25.35, 92.30], zoom: 9 },
  { id: "manipur", name: "⛰️ Manipur NH-2 / NH-37 Corridors", center: [24.85, 93.70], zoom: 10 },
  { id: "assam", name: "🚂 Assam Barail & Dima Hasao", center: [25.18, 93.03], zoom: 10 },
  { id: "arunachal", name: "🌲 Arunachal NH-13 (Trans-Arunachal)", center: [27.50, 92.80], zoom: 8 },
  { id: "mizoram", name: "🏘️ Mizoram NH-54 (Aizawl)", center: [23.73, 92.71], zoom: 11 },
  { id: "national", name: "🇮🇳 National High-Risk Zones", center: [28.50, 78.50], zoom: 6 }
];

export default function App() {
  const [rainfall, setRainfall] = useState(45.0);
  const [weatherData, setWeatherData] = useState(null);
  const [corridorData, setCorridorData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [regions, setRegions] = useState(DEFAULT_REGIONS);
  const [selectedRegionId, setSelectedRegionId] = useState("all");
  const [mapCenter, setMapCenter] = useState([26.20, 92.20]);
  const [mapZoom, setMapZoom] = useState(7);
  const [slopes, setSlopes] = useState([]);
  const [routingData, setRoutingData] = useState(null);
  const [multilingualAlert, setMultilingualAlert] = useState(null);
  const [capXml, setCapXml] = useState("");
  const [selectedSlope, setSelectedSlope] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState("safe");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial load: Fetch corridor, all hotspots, regions, live satellite weather, and initial slopes
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        const [corrRes, hotRes, regRes, weatherRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/corridor`).then(r => r.json()),
          fetch(`${API_BASE}/api/hotspots?region=ALL`).then(r => r.json()),
          fetch(`${API_BASE}/api/regions`).then(r => r.json()),
          fetch(`${API_BASE}/api/weather/live?region=all`).then(r => r.json())
        ]);

        if (corrRes.status === "fulfilled") setCorridorData(corrRes.value);
        if (hotRes.status === "fulfilled") setHotspots(hotRes.value);
        if (regRes.status === "fulfilled" && Array.isArray(regRes.value) && regRes.value.length > 0) {
          setRegions(regRes.value);
        }
        if (weatherRes.status === "fulfilled") setWeatherData(weatherRes.value);

        // Initial simulation run
        await runSimulation(45.0);
      } catch (err) {
        console.warn("API offline or initial load fallback:", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Handle region dropdown change
  const handleRegionChange = async (regionId) => {
    setSelectedRegionId(regionId);
    setSelectedHotspot(null);
    const matchedRegion = regions.find(r => r.id === regionId);

    if (matchedRegion) {
      setMapCenter(matchedRegion.center);
      setMapZoom(matchedRegion.zoom);
    }

    try {
      // 1. Fetch hotspots filtered by region
      const hotRes = await fetch(`${API_BASE}/api/hotspots?region=${regionId.toUpperCase()}`);
      if (hotRes.ok) {
        const data = await hotRes.json();
        setHotspots(data);
      }

      // 2. Fetch live satellite weather for this region
      const wRes = await fetch(`${API_BASE}/api/weather/live?region=${regionId}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        setWeatherData(wData);
      }
    } catch (err) {
      console.warn("Error switching region:", err);
    }
  };

  // Handle hotspot inspection on map
  const handleSelectHotspot = (hotspot, incomingWeather) => {
    setSelectedHotspot(hotspot);
    setSelectedSlope(null); // Switch drawer focus to hotspot

    const [lon, lat] = hotspot.coordinates;
    setMapCenter([lat, lon]);

    if (incomingWeather) {
      setWeatherData(incomingWeather);
    }
  };

  const handleSelectSlope = (slope) => {
    setSelectedSlope(slope);
    setSelectedHotspot(null); // Switch drawer focus to slope
  };

  const runSimulation = async (rainMm) => {
    setRainfall(rainMm);
    try {
      const res = await fetch(`${API_BASE}/api/simulate-cloudburst?rainfall_mm=${rainMm}`);
      if (res.ok) {
        const data = await res.json();
        setSlopes(data.slopes);
        setRoutingData(data.evacuation_routes);
        setMultilingualAlert(data.multilingual_alert);

        if (selectedSlope) {
          const updated = data.slopes.find(s => s.slope_id === selectedSlope.slope_id);
          if (updated) setSelectedSlope(updated);
        }
      }

      // Fetch CAP XML
      const xmlRes = await fetch(`${API_BASE}/api/alerts/cap?rainfall_mm=${rainMm}`);
      if (xmlRes.ok) {
        const xml = await xmlRes.text();
        setCapXml(xml);
      }
    } catch (err) {
      console.error("Simulation API call failed", err);
    }
  };

  const redSlopeCount = slopes.filter(s => s.category === "RED").length;
  const orangeSlopeCount = slopes.filter(s => s.category === "ORANGE").length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Operations Navbar */}
      <header className="h-16 px-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white">GeoRakshak-NER</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Pan-NER & National SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-Hardware Satellite Early Warning & Geo-Spatial Hazard Platform
            </p>
          </div>
        </div>

        {/* Center: Multi-Region / Corridor Selector */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono shadow-inner">
            <Globe className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-400 text-[11px] uppercase font-bold">Region:</span>
            <select
              value={selectedRegionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {regions.map(r => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                  {r.name} {r.hotspots_count ? `(${r.hotspots_count} spots)` : ''}
                </option>
              ))}
            </select>
          </div>

          <FallbackBadge weatherContext={weatherData} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAlertOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              redSlopeCount > 0
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>CAP Emergency Alert</span>
            {redSlopeCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-red-600 text-[10px] font-black">
                {redSlopeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left GIS Map View (Occupies Main Stage) */}
        <main className="flex-1 h-full relative p-3">
          <MapView
            slopes={slopes}
            hotspots={hotspots}
            corridorData={corridorData}
            selectedSlope={selectedSlope}
            onSelectSlope={handleSelectSlope}
            onSelectHotspot={handleSelectHotspot}
            selectedRoute={selectedRoute}
            isSevered={redSlopeCount > 0}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
          />
        </main>

        {/* Right Command & Control Drawer */}
        <aside className="w-[420px] h-full border-l border-slate-800 bg-slate-950/95 backdrop-blur-md p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-20">
          
          {/* Live Satellite Meteorological Telemetry Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>Live Satellite Feed</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                WMO / INSAT-3D
              </span>
            </div>

            <div className="text-xs font-bold text-slate-200 truncate mb-2.5 flex items-center gap-1.5">
              <LocateFixed className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{weatherData?.location_name || "North Eastern Region (NER)"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/60 border border-slate-700/50 p-2 rounded-xl">
                <div className="text-[9px] uppercase font-mono text-slate-400">Rain Rate</div>
                <div className="text-base font-mono font-bold text-sky-400">
                  {weatherData?.current?.precipitation_rate_mm_hr ?? 0.0} <span className="text-[10px] text-slate-400">mm/h</span>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-2 rounded-xl">
                <div className="text-[9px] uppercase font-mono text-slate-400">24h Rain</div>
                <div className="text-base font-mono font-bold text-blue-400">
                  {weatherData?.current?.recent_24h_rainfall_mm ?? 0.0} <span className="text-[10px] text-slate-400">mm</span>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 p-2 rounded-xl">
                <div className="text-[9px] uppercase font-mono text-slate-400">Cloud Cover</div>
                <div className="text-base font-mono font-bold text-amber-300">
                  {weatherData?.current?.cloud_cover_pct ?? 75}%
                </div>
              </div>
            </div>
          </div>

          {/* Quick Hazard KPI Matrix */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-mono text-slate-400">Critical Red</div>
              <div className={`text-xl font-mono font-black ${redSlopeCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {redSlopeCount}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-mono text-slate-400">Watch Orange</div>
              <div className="text-xl font-mono font-black text-orange-400">
                {orangeSlopeCount}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl text-center">
              <div className="text-[10px] uppercase font-mono text-slate-400">Hotspots</div>
              <div className="text-xl font-mono font-bold text-sky-400">
                {hotspots.length}
              </div>
            </div>
          </div>

          {/* Module 1: The Cloudburst Stress-Test Slider */}
          <CloudburstSlider
            rainfall={rainfall}
            onChange={(val) => runSimulation(val)}
            isSimulating={loading}
          />

          {/* Module 2: Hotspot or Slope Inspector (Reactively switches based on selection) */}
          {selectedHotspot ? (
            <HotspotInspector
              hotspot={selectedHotspot}
              weatherData={weatherData}
              onClose={() => setSelectedHotspot(null)}
            />
          ) : (
            <SlopeInspector
              slope={selectedSlope}
              onClose={() => setSelectedSlope(null)}
            />
          )}

          {/* Module 3: Hazard-Aware Evacuation Router */}
          <EvacuationRouter
            routingData={routingData}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
          />
        </aside>
      </div>

      {/* Emergency Multilingual Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        multilingualData={multilingualAlert}
        capXml={capXml}
      />
    </div>
  );
}
