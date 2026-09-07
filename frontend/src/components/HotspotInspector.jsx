import React from 'react';
import { AlertTriangle, MapPin, Layers, CloudRain, ShieldAlert, X, Gauge, Thermometer, Wind } from 'lucide-react';

export default function HotspotInspector({ hotspot, weatherData, onClose }) {
  if (!hotspot) return null;

  const isVeryHigh = hotspot.gsi_susceptibility?.toLowerCase().includes("very high");
  const isHigh = hotspot.gsi_susceptibility?.toLowerCase() === "high";

  const badgeClass = isVeryHigh 
    ? "bg-red-500/20 text-red-400 border-red-500/40" 
    : isHigh 
    ? "bg-orange-500/20 text-orange-400 border-orange-500/40" 
    : "bg-amber-500/20 text-amber-400 border-amber-500/40";

  const currentRain = weatherData?.current?.recent_24h_rainfall_mm ?? 0.0;
  const rainRate = weatherData?.current?.precipitation_rate_mm_hr ?? 0.0;
  const temp = weatherData?.current?.temperature_c ?? 22.0;

  return (
    <div className="bg-slate-900/95 border border-sky-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${badgeClass}`}>
              GSI {hotspot.gsi_susceptibility} RISK
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {hotspot.id}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100">{hotspot.name}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-sky-400" />
            <span>{hotspot.location}</span>
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Satellite Real-Time Weather Metrics */}
      <div className="bg-slate-950/80 border border-sky-500/30 rounded-lg p-2.5 mb-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-sky-300 font-bold uppercase tracking-wider mb-2">
          <div className="flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Satellite Observations</span>
          </div>
          <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 text-[9px]">
            ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
          <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">Rain Rate</div>
            <div className="text-xs font-bold text-sky-400">{rainRate} mm/h</div>
          </div>
          <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">24h Rain</div>
            <div className="text-xs font-bold text-blue-400">{currentRain} mm</div>
          </div>
          <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
            <div className="text-[9px] text-slate-400">Temp</div>
            <div className="text-xs font-bold text-amber-300">{temp}°C</div>
          </div>
        </div>
      </div>

      {/* Geological & Hazard Parameters */}
      <div className="space-y-2 mb-3 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            Geological Lithology
          </div>
          <div className="font-semibold text-slate-200">
            {hotspot.lithology}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
              Failure Mode
            </div>
            <div className="font-semibold text-amber-400 text-[11px]">
              {hotspot.failure_type}
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
              Slope Angle
            </div>
            <div className="font-semibold text-slate-200 text-[11px]">
              {hotspot.slope_deg}° at {hotspot.elevation_m}m
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            Historical Trigger Threshold
          </div>
          <div className="text-slate-300 text-[11px]">
            {hotspot.historical_triggers}
          </div>
        </div>
      </div>

      {/* Operational Protocol Badge */}
      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="text-[10px] text-slate-300">
          <span className="font-bold text-slate-100">Protocol: </span>
          {isVeryHigh 
            ? "Continuous telemetry watch active. Ground convoy rerouting advisory armed."
            : "Standard meteorological vigilance. Maintenance teams briefed."}
        </div>
      </div>
    </div>
  );
}
