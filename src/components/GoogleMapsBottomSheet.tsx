import React, { useState, useRef, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Crosshair,
  Eye,
  Footprints,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { DemoScenario, RouteSafetyAnalysis, RouteSegment } from '../types';
import { DEMO_SCENARIOS } from '../data/demoScenarios';

export type SheetState = 'peek' | 'mid' | 'full';

interface GoogleMapsBottomSheetProps {
  sheetState: SheetState;
  setSheetState: (state: SheetState) => void;
  originText: string;
  setOriginText: (t: string) => void;
  destinationText: string;
  setDestinationText: (t: string) => void;
  onCalculateRoute: () => void;
  isCalculating: boolean;
  onSelectScenario: (sc: DemoScenario) => void;
  selectedScenarioId?: string;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  safestRoute: RouteSafetyAnalysis | null;
  fastestRoute: RouteSafetyAnalysis | null;
  activeRouteType: 'safest' | 'fastest';
  setActiveRouteType: (t: 'safest' | 'fastest') => void;
  selectedSegment: RouteSegment | null;
  setSelectedSegment: (seg: RouteSegment | null) => void;
}

export const GoogleMapsBottomSheet: React.FC<GoogleMapsBottomSheetProps> = ({
  sheetState,
  setSheetState,
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
  safestRoute,
  fastestRoute,
  activeRouteType,
  setActiveRouteType,
  selectedSegment,
  setSelectedSegment,
}) => {
  const currentRoute = activeRouteType === 'safest' ? safestRoute : fastestRoute;

  // Touch drag state for mobile flicking
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return;
    const delta = touchDeltaY.current;

    // Flicked up (negative delta > 40px)
    if (delta < -40) {
      if (sheetState === 'peek') setSheetState('mid');
      else if (sheetState === 'mid') setSheetState('full');
    }
    // Flicked down (positive delta > 40px)
    else if (delta > 40) {
      if (sheetState === 'full') setSheetState('mid');
      else if (sheetState === 'mid') setSheetState('peek');
    }

    touchStartY.current = null;
    touchDeltaY.current = 0;
  };

  // Helper colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/40';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/40';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return { text: 'Protected', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (score >= 55)
      return { text: 'Caution', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    return { text: 'High Risk', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  };

  // Height styles corresponding to Google Maps sheet states
  const heightClasses = {
    peek: 'h-[105px]',
    mid: 'h-[50vh] sm:h-[420px]',
    full: 'h-[86vh]',
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-out select-none flex flex-col justify-end`}
    >
      <div
        className={`w-full max-w-xl mx-auto bg-neutral-900/98 backdrop-blur-2xl border-t border-x border-neutral-800 rounded-t-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.7)] flex flex-col transition-all duration-300 ease-out overflow-hidden text-neutral-100 ${heightClasses[sheetState]}`}
      >
        {/* DRAG HANDLE BAR (Flick area) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (sheetState === 'peek') setSheetState('mid');
            else if (sheetState === 'mid') setSheetState('full');
            else setSheetState('peek');
          }}
          className="w-full pt-2.5 pb-2 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center shrink-0 border-b border-neutral-800/60 hover:bg-neutral-800/40 transition-colors"
        >
          <div className="w-12 h-1.5 rounded-full bg-neutral-600/90 mb-1" />
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-medium tracking-wide">
            {sheetState === 'peek' && (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span>Swipe up for Route Editor & Safety Breakdown</span>
              </>
            )}
            {sheetState === 'mid' && (
              <>
                <ChevronUp className="w-3 h-3 text-neutral-400" />
                <span>Swipe up for Deep Analysis • Swipe down to collapse</span>
              </>
            )}
            {sheetState === 'full' && (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                <span>Swipe down to view Map</span>
              </>
            )}
          </div>
        </div>

        {/* =========================================================================
            HEADER PREVIEW (Always visible in peek, mid, and full)
           ========================================================================= */}
        <div className="px-4 py-2.5 shrink-0 flex items-center justify-between gap-3 border-b border-neutral-800/50 bg-neutral-900/60">
          {currentRoute ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Score Chip */}
              <div
                className={`w-12 h-12 shrink-0 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(
                  currentRoute.overallSafetyScore
                )}`}
              >
                <span className="text-base leading-none">{currentRoute.overallSafetyScore}</span>
                <span className="text-[8px] uppercase tracking-tighter opacity-70">/ 100</span>
              </div>

              {/* Title & Stats */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-xs sm:text-sm text-neutral-100 truncate">
                    {activeRouteType === 'safest' ? 'Safest Path' : 'Fastest Path'}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      getScoreBadge(currentRoute.overallSafetyScore).bg
                    }`}
                  >
                    {getScoreBadge(currentRoute.overallSafetyScore).text}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-[11px] text-neutral-400 mt-0.5 font-mono">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    ~{currentRoute.estimatedDurationMinutes} min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Footprints className="w-3 h-3 text-neutral-400" />
                    {currentRoute.totalDistanceMeters}m
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-neutral-400 flex-1 truncate">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tap to configure route & destination</span>
            </div>
          )}

          {/* Quick Route Switcher Pill (Safest vs Fastest) */}
          <div className="flex items-center p-0.5 rounded-xl bg-neutral-950 border border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveRouteType('safest');
                setSelectedSegment(null);
              }}
              title="Safest Shielded Route"
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                activeRouteType === 'safest'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span className="hidden xs:inline">Safe</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRouteType('fastest');
                setSelectedSegment(null);
              }}
              title="Fastest Direct Route"
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                activeRouteType === 'fastest'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span className="hidden xs:inline">Fast</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            SCROLLABLE EXPANDED BODY (Visible in mid and full)
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
          {/* 1. ROUTE EDITOR: Origin & Destination Inputs with GPS button */}
          <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
              <span>Change or Add Walking Route</span>
              <button
                type="button"
                onClick={onUseCurrentLocation}
                disabled={isLocating}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Crosshair className="w-3 h-3" />
                )}
                <span>Use My Location</span>
              </button>
            </div>

            {/* Origin */}
            <div className="relative flex items-center">
              <div className="absolute left-2.5 text-cyan-400 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/20" />
              </div>
              <input
                type="text"
                value={originText}
                onChange={(e) => setOriginText(e.target.value)}
                placeholder="Current Location / Starting Point"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-10 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
              />
              <button
                type="button"
                onClick={onUseCurrentLocation}
                disabled={isLocating}
                title="Detect GPS"
                className="absolute right-1.5 p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                ) : (
                  <Crosshair className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Destination */}
            <div className="relative flex items-center">
              <div className="absolute left-2.5 text-rose-400 pointer-events-none">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                placeholder="Where to go? (Destination)"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            {/* Benchmark Scenario Chips */}
            <div className="pt-1">
              <div className="text-[10px] text-neutral-500 font-medium mb-1 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Quick Live Scenarios:
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {DEMO_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => onSelectScenario(sc)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-850'
                      }`}
                    >
                      {sc.name.split('—')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recalculate CTA */}
            <button
              type="button"
              onClick={() => {
                onCalculateRoute();
                // If in mid mode, keep comfortable viewing or auto-fit
              }}
              disabled={isCalculating || !originText || !destinationText}
              className="w-full mt-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing 100m Segments...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                  <span>Calculate Safe Path</span>
                </>
              )}
            </button>
          </div>

          {currentRoute && (
            <>
              {/* 2. WEAKEST-LINK BOTTLENECK ALERT */}
              {currentRoute.isBottlenecked && (
                <div className="p-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <span>Weakest-Link Bottleneck Enforced</span>
                    </div>
                    <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                      {currentRoute.bottleneckReason}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. 100-METER SEGMENT SPARKLINE */}
              <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-2.5">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-semibold text-neutral-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    100m Segments ({currentRoute.segments.length})
                  </span>
                  <span className="text-[10px] text-neutral-500">Tap bar to inspect</span>
                </div>

                <div className="grid grid-flow-col auto-cols-fr gap-1 bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800/80">
                  {currentRoute.segments.map((seg) => {
                    const isSelected = selectedSegment?.index === seg.index;
                    const bg =
                      seg.score >= 75
                        ? 'bg-emerald-500'
                        : seg.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500';

                    return (
                      <button
                        key={`spark-${seg.index}`}
                        type="button"
                        onClick={() => setSelectedSegment(isSelected ? null : seg)}
                        title={`Segment #${seg.index + 1}: ${seg.score}/100`}
                        className={`h-8 rounded transition-all flex flex-col items-center justify-end p-0.5 ${
                          isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:opacity-85'
                        }`}
                      >
                        <div
                          className={`w-full rounded-xs ${bg}`}
                          style={{ height: `${Math.max(25, seg.score)}%` }}
                        />
                        <span className="text-[7px] font-mono text-neutral-400 leading-none mt-0.5">
                          {seg.index + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. SELECTED SEGMENT INSPECTOR */}
              {selectedSegment && (
                <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-700 relative animate-in fade-in">
                  <button
                    onClick={() => setSelectedSegment(null)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Segment #{selectedSegment.index + 1} ({selectedSegment.startDistanceMeters}m -{' '}
                      {selectedSegment.endDistanceMeters}m)
                    </span>
                    <span className="text-xs font-mono font-bold text-neutral-200">
                      Score: {selectedSegment.score}/100
                    </span>
                  </div>

                  {selectedSegment.warnings.length > 0 && (
                    <div className="space-y-1 my-1.5">
                      {selectedSegment.warnings.map((w, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-900/50 p-2 rounded-xl flex items-start gap-1.5"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSegment.positives.length > 0 && (
                    <div className="space-y-1 my-1.5">
                      {selectedSegment.positives.map((p, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 p-2 rounded-xl flex items-start gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 30m Buffer Venues */}
                  <div className="mt-2 pt-2 border-t border-neutral-800">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3 text-neutral-400" />
                      Active Venues in 30m Buffer:
                    </div>
                    {selectedSegment.activeVenues.length === 0 ? (
                      <div className="text-[11px] text-amber-300/80 italic py-0.5">
                        No open businesses active at this hour.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {selectedSegment.activeVenues.map((v) => (
                          <div
                            key={v.id}
                            className="bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-neutral-200 text-[11px]">
                                {v.name}
                              </div>
                              <div className="text-[9px] text-emerald-400">
                                {v.operatingHoursSummary}
                              </div>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              +{v.safetyBonus} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. THE 3 CORE PILLARS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-center">
                  <Eye className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
                  <div className="text-[9px] text-neutral-400">Active Eyes</div>
                  <div className="text-xs font-bold text-neutral-100 font-mono">
                    {currentRoute.activeEyesScore}%
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                  <div className="text-[9px] text-neutral-400">Dropouts</div>
                  <div className="text-xs font-bold text-neutral-100 font-mono">
                    {currentRoute.dropoutSegmentCount}
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-center">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                  <div className="text-[9px] text-neutral-400">Sentiment</div>
                  <div className="text-xs font-bold text-neutral-100">
                    {currentRoute.sentimentSummary.tone}
                  </div>
                </div>
              </div>

              {/* 6. CRITICAL STREET WARNINGS */}
              <div>
                <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Specific Street Warnings
                </h4>

                {currentRoute.criticalWarnings.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>No dead-zones detected. Active storefront presence maintained.</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {currentRoute.criticalWarnings.map((warn, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-neutral-950 border border-rose-900/50 text-rose-200 text-[11px] flex items-start gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
