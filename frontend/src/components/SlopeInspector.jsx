import React from 'react';
import { Mountain, AlertOctagon, CheckCircle, Compass, Gauge, Activity } from 'lucide-react';

export default function SlopeInspector({ slope, onClose }) {
  if (!slope) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 text-center text-slate-400">
        <Mountain className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
        <p className="text-sm">Click any mountain slope polygon on the map to inspect its geotechnical telemetry.</p>
      </div>
    );
  }

  const getBadge = (category) => {
    switch (category) {
      case "RED":
        return { bg: "bg-red-500/20 text-red-400 border-red-500/40", label: "CRITICAL HAZARD" };
      case "ORANGE":
        return { bg: "bg-orange-500/20 text-orange-400 border-orange-500/40", label: "HIGH WATCH" };
      case "YELLOW":
        return { bg: "bg-amber-500/20 text-amber-400 border-amber-500/40", label: "ADVISORY" };
      default:
        return { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", label: "NORMAL" };
    }
  };

  const badge = getBadge(slope.category);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${badge.bg} mb-1.5`}>
            {badge.label}
          </span>
          <h3 className="text-base font-bold text-slate-100">{slope.slope_name}</h3>
          <p className="text-xs text-slate-400 font-mono">{slope.corridor_km} | ID: {slope.slope_id}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800"
          >
            Close
          </button>
        )}
      </div>

      {/* Geotechnical KPI Matrix */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>Factor of Safety (FoS)</span>
          </div>
          <div className={`text-xl font-mono font-black ${slope.factor_of_safety < 1.0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {slope.factor_of_safety}
            <span className="text-[10px] font-normal text-slate-500 ml-1.5">
              {slope.factor_of_safety < 1.0 ? "(Failure Condition)" : "(Stable)"}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Landslide Probability</span>
          </div>
          <div className="text-xl font-mono font-black text-slate-100">
            {Math.round(slope.landslide_probability * 100)}%
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            <span>Slope Gradient (DEM)</span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-200">
            {slope.slope_gradient_deg}° <span className="text-xs font-normal text-slate-500">at {slope.dem_elevation_m}m</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>InSAR Satellite Creep</span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-200">
            {slope.insar_creep_mm_yr} <span className="text-xs font-normal text-slate-500">mm / yr</span>
          </div>
        </div>
      </div>

      {/* Recommended Emergency Action */}
      <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/60">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
          Operational Protocol (NDMA Guidelines):
        </div>
        <p className="text-xs text-slate-300 font-medium">
          {slope.recommended_action}
        </p>
      </div>
    </div>
  );
}
