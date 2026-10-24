import React from 'react';
import { ShieldCheck, Search, Sparkles } from 'lucide-react';
import { DemoScenario } from '../types';

interface FloatingMapHeaderProps {
  currentScenario: DemoScenario;
  onOpenSearch: () => void;
  destinationText: string;
}

export const FloatingMapHeader: React.FC<FloatingMapHeaderProps> = ({
  currentScenario,
  onOpenSearch,
  destinationText,
}) => {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between max-w-xl mx-auto">
      {/* Brand & Active Scenario Pill */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="pointer-events-auto group bg-neutral-900/90 hover:bg-neutral-850 backdrop-blur-xl border border-neutral-800/90 rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2.5 transition-all active:scale-95 text-left"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold text-xs tracking-tight text-neutral-100">AMOGH</span>
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              SafePath
            </span>
          </div>
          <div className="text-[10px] text-neutral-400 truncate max-w-[170px] sm:max-w-[220px] mt-0.5">
            To: <span className="text-neutral-200 font-medium">{destinationText || currentScenario.destinationName}</span>
          </div>
        </div>
        <div className="p-1 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 text-neutral-300">
          <Search className="w-3 h-3 text-emerald-400" />
        </div>
      </button>

      {/* Floating Live Tag */}
      <div className="pointer-events-none hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-[10px] text-neutral-300 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium">100m Live Scan</span>
      </div>
    </div>
  );
};
