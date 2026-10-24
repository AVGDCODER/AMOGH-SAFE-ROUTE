import { LatLng, PlaceAmenity } from '../types';

/**
 * Decodes Google Maps Encoded Polyline into LatLng array
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Queries Google Places within a tight 30m buffer zone of a coordinate using Places API (New)
 */
export async function fetchPlacesNearCoordinate(
  coord: LatLng,
  radiusMeters = 35
): Promise<PlaceAmenity[]> {
  try {
    if (typeof window === 'undefined' || !window.google?.maps?.importLibrary) {
      return [];
    }

    const { Place } = (await google.maps.importLibrary('places')) as any;
    if (!Place || !Place.searchNearby) {
      return [];
    }

    const request = {
      locationRestriction: {
        center: { lat: coord.lat, lng: coord.lng },
        radius: radiusMeters,
      },
      fields: [
        'displayName',
        'types',
        'currentOpeningHours',
        'regularOpeningHours',
        'rating',
        'userRatingCount',
        'reviews',
      ],
      maxResultCount: 6,
    };

    const response = await Place.searchNearby(request);
    const places = response?.places || [];

    return places.map((p: any, i: number) => {
      const isOpen = Boolean(
        p.currentOpeningHours?.openNow ?? p.regularOpeningHours?.openNow ?? true
      );
      const name = p.displayName || `Commercial Venue #${i + 1}`;
      const types = p.types || ['store'];
      const reviews = (p.reviews || []).map((r: any) => r.text || '').filter(Boolean);

      // Compute safety bonus based on type
      let bonus = 15;
      const typeStr = types.join(' ').toLowerCase();
      if (typeStr.includes('convenience') || typeStr.includes('supermarket')) bonus = 30;
      else if (typeStr.includes('pharmacy') || typeStr.includes('hospital')) bonus = 35;
      else if (typeStr.includes('police')) bonus = 45;
      else if (typeStr.includes('transit') || typeStr.includes('station')) bonus = 28;
      else if (typeStr.includes('cafe') || typeStr.includes('restaurant')) bonus = 20;

      return {
        id: p.id || `place-${coord.lat.toFixed(4)}-${i}`,
        name,
        type: types[0] || 'store',
        isOpenNow: isOpen,
        operatingHoursSummary: isOpen ? 'Currently Open' : 'Closed',
        rating: p.rating || 4.2,
        snippetReviews: reviews,
        safetyBonus: isOpen ? bonus : -10,
      };
    });
  } catch (err) {
    console.warn('Place searchNearby non-fatal fallback:', err);
    return [];
  }
}

/**
 * Computes walking route using the modern Routes API SDK wrapper
 */
export async function computeWalkingRoutes(
  origin: LatLng | string,
  destination: LatLng | string
): Promise<{
  routes: Array<{
    path: LatLng[];
    distanceMeters: number;
    durationMillis: number;
    viewport?: google.maps.LatLngBounds;
  }>;
}> {
  if (typeof window === 'undefined' || !window.google?.maps?.importLibrary) {
    throw new Error('Google Maps SDK not loaded yet.');
  }

  const routesLib = (await google.maps.importLibrary('routes')) as any;
  if (!routesLib?.Route?.computeRoutes) {
    throw new Error('Routes API library unavailable.');
  }

  const request = {
    origin,
    destination,
    travelMode: 'WALKING',
    computeAlternativeRoutes: true,
    fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
  };

  const response = await routesLib.Route.computeRoutes(request);
  if (!response?.routes || response.routes.length === 0) {
    throw new Error('No walking routes found between locations.');
  }

  const extracted = response.routes.map((r: any) => {
    let path: LatLng[] = [];

    // 1. Check if r.path has getArray() (Google Maps MVCArray)
    if (r.path && typeof r.path.getArray === 'function') {
      const arr = r.path.getArray();
      path = arr.map((pt: any) => ({
        lat: typeof pt.lat === 'function' ? pt.lat() : pt.lat,
        lng: typeof pt.lng === 'function' ? pt.lng() : pt.lng,
      }));
    }
    // 2. Check standard Array
    else if (Array.isArray(r.path) && r.path.length > 0) {
      path = r.path.map((pt: any) => ({
        lat: typeof pt.lat === 'function' ? pt.lat() : pt.lat,
        lng: typeof pt.lng === 'function' ? pt.lng() : pt.lng,
      }));
    }
    // 3. Check legs polyline
    else if (r.legs?.[0]?.polyline?.encodedPolyline) {
      path = decodePolyline(r.legs[0].polyline.encodedPolyline);
    }
    // 4. Check native createPolylines method
    else if (typeof r.createPolylines === 'function') {
      try {
        const polylines = r.createPolylines();
        if (polylines && polylines.length > 0) {
          polylines.forEach((pl: any) => {
            const arr = pl.getPath?.()?.getArray?.();
            if (arr && Array.isArray(arr)) {
              arr.forEach((pt: any) => {
                path.push({
                  lat: typeof pt.lat === 'function' ? pt.lat() : pt.lat,
                  lng: typeof pt.lng === 'function' ? pt.lng() : pt.lng,
                });
              });
            }
          });
        }
      } catch (err) {
        console.warn('createPolylines path extraction non-fatal:', err);
      }
    }

    // Clean valid finite coordinates
    path = path.filter(
      (p) =>
        typeof p.lat === 'number' &&
        !isNaN(p.lat) &&
        isFinite(p.lat) &&
        typeof p.lng === 'number' &&
        !isNaN(p.lng) &&
        isFinite(p.lng)
    );

    return {
      path,
      distanceMeters: r.distanceMeters || 0,
      durationMillis: r.durationMillis || 0,
      viewport: r.viewport,
    };
  });

  return { routes: extracted };
}

/**
 * Geocodes an address or query into coordinates
 */
export async function searchLocationByText(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const { Place } = (await google.maps.importLibrary('places')) as any;
    if (Place?.searchByText) {
      const res = await Place.searchByText({
        textQuery: query,
        fields: ['displayName', 'location'],
        maxResultCount: 1,
      });
      if (res?.places?.[0]?.location) {
        const loc = res.places[0].location;
        return {
          lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
          lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng,
          name: res.places[0].displayName || query,
        };
      }
    }
  } catch (err) {
    console.warn('searchByText fallback:', err);
  }
  return null;
}
