import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  Footprints,
  Info,
  MessageSquare,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { RouteSafetyAnalysis, RouteSegment } from '../types';

interface SafetyDrawerProps {
  safestRoute: RouteSafetyAnalysis | null;
  fastestRoute: RouteSafetyAnalysis | null;
  activeRouteType: 'safest' | 'fastest';
  setActiveRouteType: (type: 'safest' | 'fastest') => void;
  selectedSegment: RouteSegment | null;
  setSelectedSegment: (segment: RouteSegment | null) => void;
}

export const SafetyDrawer: React.FC<SafetyDrawerProps> = ({
  safestRoute,
  fastestRoute,
  activeRouteType,
  setActiveRouteType,
  selectedSegment,
  setSelectedSegment,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentRoute = activeRouteType === 'safest' ? safestRoute : fastestRoute;

  if (!currentRoute) {
    return (
      <div className="absolute bottom-4 left-4 right-4 z-20 max-w-lg mx-auto">
        <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 text-center shadow-2xl">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-neutral-100">Ready to Calculate Safe Walking Route</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Enter your destination or tap a benchmark scenario to analyze real-time active venues, review sentiment, and 100m street hazards.
          </p>
        </div>
      </div>
    );
  }

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getBadgeColor = (status: 'safe' | 'moderate' | 'hazard') => {
    if (status === 'safe') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (status === 'moderate') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 max-w-xl mx-auto transition-all duration-300 px-3 pb-3">
      <div className="bg-neutral-900/95 backdrop-blur-2xl border border-neutral-800/90 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 flex flex-col max-h-[85vh]">
        {/* Drag / Expansion Handle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full pt-2.5 pb-1 flex flex-col items-center justify-center hover:bg-neutral-800/30 transition-colors"
        >
          <div className="w-12 h-1 rounded-full bg-neutral-700/80 mb-1" />
          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-400">
            <span>{isExpanded ? 'Hide Analysis Details' : 'View Full Safety Analysis'}</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Route Selector Tab Pill */}
        <div className="px-4 py-2 flex items-center gap-2 border-b border-neutral-800/80">
          <button
            type="button"
            onClick={() => {
              setActiveRouteType('safest');
              setSelectedSegment(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
              activeRouteType === 'safest'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-neutral-800/50 text-neutral-400 border-neutral-700/40 hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="leading-tight">Safest Route</div>
              <div className="text-[10px] font-normal text-emerald-400/80">
                Score: {safestRoute?.overallSafetyScore ?? '--'}/100
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRouteType('fastest');
              setSelectedSegment(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
              activeRouteType === 'fastest'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-neutral-800/50 text-neutral-400 border-neutral-700/40 hover:bg-neutral-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="leading-tight">Fastest Route</div>
              <div className="text-[10px] font-normal text-amber-400/80">
                Score: {fastestRoute?.overallSafetyScore ?? '--'}/100
              </div>
            </div>
          </button>
        </div>

        {/* Primary Route Score Banner */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Circular Gauge Preview */}
            <div
              className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(
                currentRoute.overallSafetyScore
              )}`}
            >
              <span className="text-lg leading-none">{currentRoute.overallSafetyScore}</span>
              <span className="text-[9px] uppercase tracking-tighter opacity-75">/ 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-neutral-100">
                  {activeRouteType === 'safest' ? 'Shielded Walking Path' : 'Direct Walking Path'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    currentRoute.overallSafetyScore >= 75
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : currentRoute.overallSafetyScore >= 50
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {currentRoute.overallSafetyScore >= 75
                    ? 'Protected'
                    : currentRoute.overallSafetyScore >= 50
                    ? 'Caution'
                    : 'High Hazard'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Footprints className="w-3.5 h-3.5 text-neutral-400" />
                  {currentRoute.totalDistanceMeters}m
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  ~{currentRoute.estimatedDurationMinutes} mins walk
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs border border-neutral-700/60 font-semibold"
          >
            {isExpanded ? 'Less' : 'Details'}
          </button>
        </div>

        {/* Weakest Link Bottleneck Warning Box */}
        {currentRoute.isBottlenecked && (
          <div className="mx-4 mb-2.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <span>Weakest-Link Bottleneck Activated</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/30 border border-rose-500/50">
                  Penalty Applied
                </span>
              </div>
              <p className="text-[11px] text-rose-200/90 mt-0.5 leading-relaxed">
                {currentRoute.bottleneckReason}
              </p>
            </div>
          </div>
        )}

        {/* 100-Meter Segment Timeline Sparkline */}
        <div className="px-4 py-2 border-t border-neutral-800/60">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-neutral-300 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              100-Meter Segment Safety Profile ({currentRoute.segments.length} segments)
            </span>
            <span className="text-[10px] text-neutral-400">Tap segment to inspect</span>
          </div>

          <div className="grid grid-flow-col auto-cols-fr gap-1 bg-neutral-950/80 p-1.5 rounded-xl border border-neutral-800">
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
                  title={`Segment ${seg.index + 1} (${seg.startDistanceMeters}m-${seg.endDistanceMeters}m): ${seg.score}/100`}
                  className={`h-8 rounded-md transition-all flex flex-col items-center justify-end p-0.5 relative group ${
                    isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:opacity-90'
                  }`}
                >
                  <div
                    className={`w-full rounded-sm ${bg} transition-all`}
                    style={{ height: `${Math.max(25, seg.score)}%` }}
                  />
                  <span className="text-[8px] font-mono text-neutral-400 leading-none mt-0.5">
                    #{seg.index + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Segment Inspection Card */}
        {selectedSegment && (
          <div className="mx-4 my-2 p-3 rounded-2xl bg-neutral-950 border border-neutral-700/80 shadow-inner relative animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedSegment(null)}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(
                  selectedSegment.safetyStatus
                )}`}
              >
                Segment #{selectedSegment.index + 1} ({selectedSegment.startDistanceMeters}m —{' '}
                {selectedSegment.endDistanceMeters}m)
              </span>
              <span className="text-xs font-mono font-bold text-neutral-200">
                Score: {selectedSegment.score}/100
              </span>
            </div>

            {/* Warnings or Positives */}
            {selectedSegment.warnings.length > 0 && (
              <div className="mb-2 space-y-1">
                {selectedSegment.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] text-rose-300 bg-rose-950/30 border border-rose-900/50 p-2 rounded-xl flex items-start gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedSegment.positives.length > 0 && (
              <div className="mb-2 space-y-1">
                {selectedSegment.positives.map((p, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 p-2 rounded-xl flex items-start gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Venues in 30m buffer */}
            <div className="mt-2 pt-2 border-t border-neutral-800">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-neutral-400" />
                Active Venues within 30m Buffer:
              </div>
              {selectedSegment.activeVenues.length === 0 ? (
                <div className="text-[11px] text-amber-300/80 italic py-1">
                  No open commercial storefronts active at this local hour.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedSegment.activeVenues.map((v) => (
                    <div
                      key={v.id}
                      className="bg-neutral-900/80 border border-neutral-800/80 rounded-xl p-2 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-neutral-200">{v.name}</div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {v.operatingHoursSummary}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        +{v.safetyBonus} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded Deep Analysis Details (Scrollable) */}
        {isExpanded && (
          <div className="px-4 py-3 overflow-y-auto space-y-3.5 border-t border-neutral-800">
            {/* 3 Core Safety Pillars */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 text-center">
                <Eye className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] text-neutral-400">Eyes on Street</div>
                <div className="text-sm font-bold text-neutral-100 mt-0.5 font-mono">
                  {currentRoute.activeEyesScore}%
                </div>
                <div className="text-[9px] text-emerald-400/80 mt-0.5">Operating Hours</div>
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 text-center">
                <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-[10px] text-neutral-400">Dropouts</div>
                <div className="text-sm font-bold text-neutral-100 mt-0.5 font-mono">
                  {currentRoute.dropoutSegmentCount}
                </div>
                <div className="text-[9px] text-amber-400/80 mt-0.5">Shuttered Zones</div>
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 text-center">
                <MessageSquare className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-[10px] text-neutral-400">Sentiment</div>
                <div className="text-sm font-bold text-neutral-100 mt-0.5">
                  {currentRoute.sentimentSummary.tone}
                </div>
                <div className="text-[9px] text-cyan-400/80 mt-0.5">
                  +{currentRoute.sentimentSummary.positiveMentions} / -
                  {currentRoute.sentimentSummary.negativeMentions}
                </div>
              </div>
            </div>

            {/* Critical Street Warnings Section */}
            <div>
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Specific Street Warnings & Bottlenecks
              </h4>

              {currentRoute.criticalWarnings.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No severe dropouts detected. Continuous open storefront presence maintained along the corridor.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentRoute.criticalWarnings.map((warn, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-rose-900/50 text-rose-200 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparative Difference Note */}
            <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
              <span className="font-bold text-neutral-200">How AMOGH SafePath Works:</span> Unlike traditional GPS which guides pedestrians down dark, deserted alleys simply to save 90 seconds, AMOGH SafePath evaluates strict 100m slices against active operating hours of local businesses, review sentiment keywords ("well-lit" vs "dimly lit"), and enforces weakest-link bottle-necking.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
