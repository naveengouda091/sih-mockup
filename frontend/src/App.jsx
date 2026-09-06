import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Mountain, 
  CloudRain, 
  Layers, 
  Radio, 
  Bell, 
  AlertTriangle, 
  Navigation,
  RefreshCw,
  ExternalLink,
  Activity
} from 'lucide-react';

import MapView from './components/MapView';
import CloudburstSlider from './components/CloudburstSlider';
import SlopeInspector from './components/SlopeInspector';
import EvacuationRouter from './components/EvacuationRouter';
import AlertModal from './components/AlertModal';
import FallbackBadge from './components/FallbackBadge';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [rainfall, setRainfall] = useState(45.0);
  const [weatherData, setWeatherData] = useState(null);
  const [corridorData, setCorridorData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [slopes, setSlopes] = useState([]);
  const [routingData, setRoutingData] = useState(null);
  const [multilingualAlert, setMultilingualAlert] = useState(null);
  const [capXml, setCapXml] = useState("");
  const [selectedSlope, setSelectedSlope] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState("safe");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial load: Fetch corridor, hotspots, live weather, and initial slopes
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        // 1. Corridor & Hotspots
        const [corrRes, hotRes, weatherRes] = await Promise.allSettled([
          fetch(`${API_BASE}/api/corridor`).then(r => r.json()),
          fetch(`${API_BASE}/api/hotspots`).then(r => r.json()),
          fetch(`${API_BASE}/api/weather/live`).then(r => r.json())
        ]);

        if (corrRes.status === "fulfilled") setCorridorData(corrRes.value);
        if (hotRes.status === "fulfilled") setHotspots(hotRes.value);
        if (weatherRes.status === "fulfilled") setWeatherData(weatherRes.value);

        // 2. Initial simulation run
        await runSimulation(45.0);
      } catch (err) {
        console.warn("API offline, utilizing built-in fallback state", err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  const runSimulation = async (rainMm) => {
    setRainfall(rainMm);
    try {
      const res = await fetch(`${API_BASE}/api/simulate-cloudburst?rainfall_mm=${rainMm}`);
      if (res.ok) {
        const data = await res.json();
        setSlopes(data.slopes);
        setRoutingData(data.evacuation_routes);
        setMultilingualAlert(data.multilingual_alert);

        // Keep selected slope updated if already selected
        if (selectedSlope) {
          const updated = data.slopes.find(s => s.slope_id === selectedSlope.slope_id);
          if (updated) setSelectedSlope(updated);
        } else if (data.slopes.length > 0) {
          setSelectedSlope(data.slopes[0]);
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
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI-Powered Landslide Early Warning & Space-Tech Evacuation Intelligence
            </p>
          </div>
        </div>

        {/* Center: System Status & Fallback Indicator */}
        <div className="hidden lg:flex items-center gap-4">
          <FallbackBadge weatherContext={weatherData} />
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>NH-10 Lifeline Corridor</span>
          </div>
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
            onSelectSlope={setSelectedSlope}
            selectedRoute={selectedRoute}
            isSevered={redSlopeCount > 0}
          />
        </main>

        {/* Right Command & Control Drawer */}
        <aside className="w-[420px] h-full border-l border-slate-800 bg-slate-950/95 backdrop-blur-md p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-20">
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
              <div className="text-[10px] uppercase font-mono text-slate-400">Corridor Status</div>
              <div className={`text-[11px] font-mono font-bold mt-1 ${redSlopeCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {redSlopeCount > 0 ? "SEVERED" : "OPEN"}
              </div>
            </div>
          </div>

          {/* Module 1: The Cloudburst Stress-Test Slider */}
          <CloudburstSlider
            rainfall={rainfall}
            onChange={(val) => runSimulation(val)}
            isSimulating={loading}
          />

          {/* Module 2: Geotechnical Slope Inspector */}
          <SlopeInspector
            slope={selectedSlope}
            onClose={() => setSelectedSlope(null)}
          />

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
