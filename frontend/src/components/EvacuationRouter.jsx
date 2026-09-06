import React from 'react';
import { Navigation, AlertTriangle, ShieldCheck, Clock, Milestone } from 'lucide-react';

export default function EvacuationRouter({ routingData, selectedRoute, onSelectRoute }) {
  if (!routingData) return null;

  const standard = routingData.standard_route;
  const safe = routingData.safe_route;
  const isSevered = routingData.is_primary_corridor_severed;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Hazard-Aware Evacuation Router
          </h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
          isSevered ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
        }`}>
          {isSevered ? "PRIMARY HIGHWAY SEVERED" : "CORRIDOR CLEAR"}
        </span>
      </div>

      <div className="text-xs text-slate-400 mb-3 space-y-1 font-mono">
        <div className="flex items-center justify-between">
          <span>Origin: Sevoke Ingress Checkpost</span>
          <span>Target: Gangtok Hospital</span>
        </div>
      </div>

      {/* Route Cards */}
      <div className="space-y-2.5">
        {/* Standard Route Card */}
        <button
          onClick={() => onSelectRoute("standard")}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            selectedRoute === "standard"
              ? "bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/50"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-200">{standard.name}</span>
            <span className="text-xs font-mono font-bold text-slate-400">{standard.distance_km} km</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {standard.estimated_duration_hrs} hrs</span>
            <span className="flex items-center gap-1"><Milestone className="w-3 h-3 text-slate-500" /> Direct</span>
          </div>
          {isSevered ? (
            <div className="flex items-start gap-1.5 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{standard.warning_advisory}</span>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Road conditions normal.
            </div>
          )}
        </button>

        {/* GeoRakshak Safe Route Card */}
        <button
          onClick={() => onSelectRoute("safe")}
          className={`w-full text-left p-3 rounded-lg border transition-all ${
            selectedRoute === "safe"
              ? "bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/50"
              : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-400">{safe.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">RECOMMENDED</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">{safe.distance_km} km</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {safe.estimated_duration_hrs} hrs</span>
            <span className="text-emerald-400/80 font-medium">Bypasses Teesta gorge hazard zones</span>
          </div>
          <div className="text-[11px] text-slate-300 bg-emerald-950/30 p-2 rounded border border-emerald-800/30">
            {safe.status}
          </div>
        </button>
      </div>
    </div>
  );
}
