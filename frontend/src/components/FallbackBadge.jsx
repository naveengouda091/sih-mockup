import React from 'react';
import { ShieldCheck, AlertTriangle, Radio } from 'lucide-react';

export default function FallbackBadge({ weatherContext }) {
  const isFallback = weatherContext?.is_fallback ?? false;
  const source = weatherContext?.source || "Open-Meteo Live Synoptic Feed";
  const statusMsg = weatherContext?.status_message || "Operational";

  if (isFallback) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono shadow-sm">
        <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-400" />
        <span className="font-semibold">OFFLINE FALLBACK ACTIVE</span>
        <span className="text-amber-300/70 hidden md:inline">| {source}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono shadow-sm">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <span className="font-semibold">LIVE SATELLITE FEED</span>
      <span className="text-emerald-300/70 hidden md:inline">| {source}</span>
    </div>
  );
}
