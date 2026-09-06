import React from 'react';
import { CloudRain, Zap, RefreshCw } from 'lucide-react';

export default function CloudburstSlider({ rainfall, onChange, onReset, isSimulating }) {
  const presets = [
    { label: "Light Rain", value: 15, color: "hover:border-emerald-500" },
    { label: "Heavy Monsoon", value: 65, color: "hover:border-amber-500" },
    { label: "Cloudburst", value: 135, color: "hover:border-orange-500" },
    { label: "Flash Flood", value: 180, color: "hover:border-red-500" },
  ];

  const getRiskColor = (val) => {
    if (val < 40) return "text-emerald-400";
    if (val < 80) return "text-amber-400";
    if (val < 120) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Cloudburst Stress-Test Simulator
            </h3>
            <p className="text-xs text-slate-400">Dynamic 24-Hour Precipitation Injection</p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-black font-mono ${getRiskColor(rainfall)}`}>
            {rainfall} <span className="text-xs font-normal text-slate-400">mm / 24h</span>
          </div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
            Soil Saturation: {Math.min(100, Math.round((rainfall / 140) * 100))}%
          </div>
        </div>
      </div>

      {/* Slider Input */}
      <div className="relative my-4">
        <input
          type="range"
          min="5"
          max="200"
          step="5"
          value={rainfall}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>5mm (Dry)</span>
          <span>50mm</span>
          <span>100mm (Alert)</span>
          <span>150mm</span>
          <span>200mm (Catastrophic)</span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange(p.value)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-all text-slate-300 hover:text-white ${p.color} ${
              rainfall === p.value ? "ring-1 ring-red-500 border-red-500/50 text-white font-semibold" : ""
            }`}
          >
            {p.label} ({p.value}m)
          </button>
        ))}
      </div>
    </div>
  );
}
