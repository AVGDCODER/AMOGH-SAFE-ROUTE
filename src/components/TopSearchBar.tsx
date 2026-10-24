import React, { useState } from 'react';
import { Crosshair, MapPin, Navigation, Sparkles, Loader2, Compass, ShieldCheck } from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { DemoScenario, LatLng } from '../types';

interface TopSearchBarProps {
  originText: string;
  setOriginText: (text: string) => void;
  destinationText: string;
  setDestinationText: (text: string) => void;
  onCalculateRoute: () => void;
  isCalculating: boolean;
  onSelectScenario: (scenario: DemoScenario) => void;
  selectedScenarioId?: string;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  originText,
  setOriginText,
  destinationText,
  setDestinationText,
  onCalculateRoute,
  isCalculating,
  onSelectScenario,
  selectedScenarioId,
  onUseCurrentLocation,
  isLocating,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute top-3 left-3 right-3 z-30 max-w-lg mx-auto transition-all duration-300">
      <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800/90 rounded-2xl shadow-2xl p-3 text-neutral-100">
        {/* App Title & Quick Toggle */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-sm text-neutral-100">AMOGH</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  SafePath
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-medium text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded bg-neutral-800/60 border border-neutral-700/50"
          >
            {isExpanded ? 'Collapse' : 'Edit Route'}
          </button>
        </div>

        {isExpanded ? (
          <>
            {/* Input Stack */}
            <div className="space-y-2">
              {/* Origin with Geolocation Target Icon */}
              <div className="relative flex items-center">
                <div className="absolute left-3 text-emerald-400 flex items-center justify-center pointer-events-none">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                </div>
                <input
                  type="text"
                  value={originText}
                  onChange={(e) => setOriginText(e.target.value)}
                  placeholder="Current Location..."
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-11 py-2 text-xs md:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={isLocating}
                  title="Detect Current GPS Location"
                  className="absolute right-2 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-emerald-400 border border-neutral-700/60 transition-colors"
                >
                  {isLocating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Crosshair className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Destination */}
              <div className="relative flex items-center">
                <div className="absolute left-3 text-rose-400 pointer-events-none">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={destinationText}
                  onChange={(e) => setDestinationText(e.target.value)}
                  placeholder="Where to go? (Destination)"
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs md:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Scenario Presets Carousel */}
            <div className="mt-2.5 pt-2 border-t border-neutral-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Live Benchmark Scenarios
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {DEMO_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => onSelectScenario(sc)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-neutral-800/60 text-neutral-300 border-neutral-700/60 hover:bg-neutral-800'
                      }`}
                    >
                      {sc.name.split('—')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calculate Button */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={onCalculateRoute}
                disabled={isCalculating || !originText || !destinationText}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-bold py-2.5 px-4 rounded-xl text-xs md:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Analyzing 100m Segments & Safety...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 fill-current" />
                    <span>Calculate Safe Path</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Collapsed Quick Summary */
          <div className="flex items-center justify-between text-xs py-1">
            <div className="truncate pr-2 text-neutral-300">
              <span className="text-emerald-400 font-medium">To:</span> {destinationText || 'No destination set'}
            </div>
            <button
              onClick={onCalculateRoute}
              disabled={isCalculating}
              className="shrink-0 px-3 py-1 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs"
            >
              {isCalculating ? 'Computing...' : 'Recalculate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
