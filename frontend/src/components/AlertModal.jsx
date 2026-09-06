import React, { useState } from 'react';
import { Bell, Radio, Globe, Copy, Check, X, ShieldAlert, Volume2 } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, multilingualData, capXml }) {
  const [activeTab, setActiveTab] = useState('en');
  const [copied, setCopied] = useState(false);
  const [showXml, setShowXml] = useState(false);

  if (!isOpen) return null;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'as', label: 'অসমীয়া' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ne', label: 'नेपाली' },
  ];

  const currentMsg = multilingualData?.messages?.[activeTab] || {
    language: "English",
    title: "EMERGENCY LANDSLIDE ADVISORY",
    body: "Pre-monsoon soil saturation high. Travel with caution.",
    action: "Follow SDMA advisory."
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(showXml ? capXml : `${currentMsg.title}\n\n${currentMsg.body}\n\n${currentMsg.action}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playSiren = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio siren not supported in this browser context.");
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-950/40 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-red-100">National Disaster Alert Dispatcher</h2>
              <p className="text-xs text-red-300/70 font-mono">ITU-T X.1303 CAP & Regional Broadcast</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={playSiren}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium border border-red-500/30 transition-all"
              title="Test Emergency Siren Tone"
            >
              <Volume2 className="w-3.5 h-3.5" /> Siren
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => { setActiveTab(l.code); setShowXml(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === l.code && !showXml
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowXml(!showXml)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              showXml 
                ? "bg-emerald-600 text-white border-emerald-500" 
                : "bg-slate-800/80 text-emerald-400 border-emerald-500/30 hover:bg-slate-700"
            }`}
          >
            {showXml ? "View SMS" : "CAP XML"}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {showXml ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-72 overflow-y-auto whitespace-pre leading-relaxed">
              {capXml}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simulated Mobile SMS Banner */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> SIKKIM-SDMA CELL-BROADCAST
                  </span>
                  <span>PRIORITY: HIGH</span>
                </div>
                <h4 className="text-sm font-bold text-red-400 mb-1.5">{currentMsg.title}</h4>
                <p className="text-sm text-slate-200 leading-relaxed mb-3">{currentMsg.body}</p>
                <div className="text-xs text-amber-400/90 font-medium bg-amber-950/20 p-2 rounded border border-amber-800/30">
                  ⚠️ Action: {currentMsg.action}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950/80 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">Standard: ITU-T X.1303 CAP / NDMA Sachet</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied to Clipboard" : "Copy Payload"}
          </button>
        </div>
      </div>
    </div>
  );
}
