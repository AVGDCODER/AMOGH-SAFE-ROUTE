import React, { useEffect, useMemo } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { LatLng, RouteSafetyAnalysis, RouteSegment } from '../types';
import { AlertTriangle, Crosshair, Flag, Navigation, ShieldAlert, Sparkles, Store } from 'lucide-react';

interface MapComponentProps {
  center: LatLng;
  zoom: number;
  origin: LatLng | null;
  destination: LatLng | null;
  safestRoute: RouteSafetyAnalysis | null;
  fastestRoute: RouteSafetyAnalysis | null;
  activeRouteType: 'safest' | 'fastest';
  selectedSegment: RouteSegment | null;
  onSelectSegment: (segment: RouteSegment) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
}

// Dark minimalist map styling for high-contrast safety visualization
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#12151c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#181b24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7e879b' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d5dcfa' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8b96ad' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#182420' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1f2533' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#181c26' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a95ab' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#273145' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1b2230' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#a0aec0' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#090c12' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4a5568' }],
  },
];

// Sub-component to manage native Google Maps Polylines & Camera bounds
const RoutePolylineRenderer: React.FC<{
  safestRoute: RouteSafetyAnalysis | null;
  fastestRoute: RouteSafetyAnalysis | null;
  activeRouteType: 'safest' | 'fastest';
  selectedSegment: RouteSegment | null;
}> = ({ safestRoute, fastestRoute, activeRouteType, selectedSegment }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const polylines: google.maps.Polyline[] = [];

    // Render Fastest Route
    if (fastestRoute?.pathCoordinates && fastestRoute.pathCoordinates.length > 0) {
      const isSelected = activeRouteType === 'fastest';
      const fastestPolyline = new google.maps.Polyline({
        path: fastestRoute.pathCoordinates,
        strokeColor: isSelected ? '#f59e0b' : '#94a3b8',
        strokeOpacity: isSelected ? 0.95 : 0.45,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 60 : 30,
      });
      fastestPolyline.setMap(map);
      polylines.push(fastestPolyline);
    }

    // Render Safest Route with Neon Green Glow
    if (safestRoute?.pathCoordinates && safestRoute.pathCoordinates.length > 0) {
      const isSelected = activeRouteType === 'safest';
      // Background glow polyline
      if (isSelected) {
        const glowPolyline = new google.maps.Polyline({
          path: safestRoute.pathCoordinates,
          strokeColor: '#059669',
          strokeOpacity: 0.35,
          strokeWeight: 12,
          zIndex: 80,
        });
        glowPolyline.setMap(map);
        polylines.push(glowPolyline);
      }

      // Main Safest Polyline
      const safestPolyline = new google.maps.Polyline({
        path: safestRoute.pathCoordinates,
        strokeColor: isSelected ? '#10b981' : '#6ee7b7',
        strokeOpacity: isSelected ? 1 : 0.5,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 90 : 40,
      });
      safestPolyline.setMap(map);
      polylines.push(safestPolyline);
    }

    // Render Selected 100m Segment highlight
    if (selectedSegment) {
      const segPolyline = new google.maps.Polyline({
        path: [selectedSegment.startPoint, selectedSegment.midPoint, selectedSegment.endPoint],
        strokeColor: selectedSegment.score < 40 ? '#ef4444' : '#38bdf8',
        strokeOpacity: 1,
        strokeWeight: 9,
        zIndex: 120,
      });
      segPolyline.setMap(map);
      polylines.push(segPolyline);
    }

    // Fit bounds to display both routes
    const allCoords = [
      ...(safestRoute?.pathCoordinates || []),
      ...(fastestRoute?.pathCoordinates || []),
    ];
    if (allCoords.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allCoords.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 120, bottom: 260, left: 40, right: 40 });
    }

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, safestRoute, fastestRoute, activeRouteType, selectedSegment]);

  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  origin,
  destination,
  safestRoute,
  fastestRoute,
  activeRouteType,
  selectedSegment,
  onSelectSegment,
  onLocateMe,
  isLocating,
}) => {
  const currentActiveRoute = activeRouteType === 'safest' ? safestRoute : fastestRoute;

  // Extract critical danger segments (score < 40)
  const dangerSegments = useMemo(() => {
    if (!currentActiveRoute) return [];
    return currentActiveRoute.segments.filter((s) => s.score < 40);
  }, [currentActiveRoute]);

  return (
    <div className="relative w-full h-full bg-neutral-950">
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="DEMO_MAP_ID"
        // MANDATORY attribution identifier per code assist rules:
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        gestureHandling="greedy"
        disableDefaultUI={true}
        zoomControl={true}
        styles={DARK_MAP_STYLES}
        className="w-full h-full"
      >
        {/* Polylines and Camera Auto-Fit */}
        <RoutePolylineRenderer
          safestRoute={safestRoute}
          fastestRoute={fastestRoute}
          activeRouteType={activeRouteType}
          selectedSegment={selectedSegment}
        />

        {/* Origin Pin */}
        {origin && (
          <AdvancedMarker position={origin} title="Origin (Current Location)">
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-cyan-400 opacity-75" />
              <div className="relative p-2 rounded-full bg-cyan-500 text-neutral-950 shadow-xl border-2 border-cyan-200">
                <Navigation className="w-4 h-4 fill-current" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Destination Pin */}
        {destination && (
          <AdvancedMarker position={destination} title="Destination">
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
              <div className="p-2 rounded-xl bg-emerald-500 text-neutral-950 shadow-xl border-2 border-emerald-200 flex items-center justify-center">
                <Flag className="w-4 h-4 fill-current" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Danger Hotspot Markers on weak link / dropout segments */}
        {dangerSegments.map((seg) => (
          <AdvancedMarker
            key={`hazard-${seg.index}`}
            position={seg.midPoint}
            title={`Critical Danger Segment #${seg.index + 1} (${seg.score}/100)`}
          >
            <button
              type="button"
              onClick={() => onSelectSegment(seg)}
              className="group relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            >
              <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-60" />
              <div className="relative p-1.5 rounded-full bg-rose-600 text-neutral-100 shadow-xl border-2 border-rose-300 hover:scale-110 transition-transform">
                <AlertTriangle className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 border border-rose-500/50 text-rose-300 text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                Dropout #{seg.index + 1}: {seg.score}/100
              </span>
            </button>
          </AdvancedMarker>
        ))}

        {/* Active Eyes Markers on high-scoring segments */}
        {currentActiveRoute?.segments
          .filter((s) => s.score >= 85)
          .slice(0, 3)
          .map((seg) => (
            <AdvancedMarker
              key={`safe-beacon-${seg.index}`}
              position={seg.midPoint}
              title={`Active Eyes Corridor #${seg.index + 1}`}
            >
              <button
                type="button"
                onClick={() => onSelectSegment(seg)}
                className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 p-1 rounded-full bg-emerald-950/80 border border-emerald-400 text-emerald-300 hover:scale-110 transition-transform shadow-lg"
              >
                <Store className="w-3 h-3" />
              </button>
            </AdvancedMarker>
          ))}
      </Map>

      {/* Floating Action Buttons (Right Edge, above bottom sheet) */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col gap-2">
        {onLocateMe && (
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            title="My Current Location"
            className="w-10 h-10 rounded-2xl bg-neutral-900/95 hover:bg-neutral-800 text-neutral-200 hover:text-emerald-400 border border-neutral-700/80 shadow-2xl flex items-center justify-center transition-all active:scale-90"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Floating Route Legend & Status Tag */}
      <div className="absolute top-16 right-3 z-20 pointer-events-none hidden sm:flex flex-col gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl p-2.5 text-[11px] shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-neutral-200 font-semibold">Safest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 rounded-full bg-amber-500" />
          <span className="text-neutral-400">Fastest Route</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
          <span className="text-rose-300">Hazard Dropout</span>
        </div>
      </div>
    </div>
  );
};
