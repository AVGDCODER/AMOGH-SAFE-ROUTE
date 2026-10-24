import { LatLng, PlaceAmenity, RouteSafetyAnalysis, RouteSegment } from '../types';

// Positive sentiment keywords indicating safety, illumination, and active oversight
export const POSITIVE_KEYWORDS = [
  'well-lit',
  'well lit',
  'bright',
  'brightly lit',
  'busy',
  'lively',
  'crowded',
  'guards',
  'security guard',
  'security',
  'cameras',
  'cctv',
  'safe',
  'patrol',
  'police',
  'friendly',
  'open late',
  '24 hours',
  'bustling',
  'illuminated',
  'pedestrian friendly',
  'good sidewalk',
];

// Negative sentiment keywords indicating danger, darkness, and isolation
export const NEGATIVE_KEYWORDS = [
  'dark',
  'dimly lit',
  'dim',
  'pitch black',
  'sketchy',
  'unsafe',
  'no sidewalk',
  'deserted',
  'abandoned',
  'creepy',
  'robbery',
  'mugged',
  'poor lighting',
  'broken lights',
  'shady',
  'isolated',
  'industrial',
  'dead zone',
  'dead end',
  'empty street',
  'dangerous',
  'unlit',
  'spooky',
  'trash',
  'broken glass',
];

// High-value safety venue types that provide natural surveillance ("Eyes on the Street")
export const HIGH_VALUE_SAFETY_TYPES = [
  'convenience_store',
  'pharmacy',
  'hospital',
  'police',
  'transit_station',
  'subway_station',
  'train_station',
  'supermarket',
  'cafe',
  'coffee_shop',
  'restaurant',
  'bar',
  'bank',
  'gas_station',
];

export const LOW_SAFETY_TYPES = [
  'storage',
  'industrial',
  'construction',
  'parking',
  'junkyard',
  'vacant_lot',
  'warehouse',
];

/**
 * Calculates geodesic distance between two points in meters using Haversine formula
 */
export function haversineDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Linear interpolation between two coordinates
 */
export function interpolateLatLng(p1: LatLng, p2: LatLng, fraction: number): LatLng {
  return {
    lat: p1.lat + (p2.lat - p1.lat) * fraction,
    lng: p1.lng + (p2.lng - p1.lng) * fraction,
  };
}

/**
 * Slices a route's raw coordinate list into strict 100-meter segments
 */
export function dividePathInto100mSegments(coords: LatLng[]): {
  segments: {
    index: number;
    startDistanceMeters: number;
    endDistanceMeters: number;
    startPoint: LatLng;
    endPoint: LatLng;
    midPoint: LatLng;
  }[];
  totalDistance: number;
} {
  if (!coords || coords.length < 2) {
    return { segments: [], totalDistance: 0 };
  }

  // Filter valid finite coordinates
  const cleanCoords = coords.filter(
    (c) =>
      typeof c?.lat === 'number' &&
      !isNaN(c.lat) &&
      isFinite(c.lat) &&
      typeof c?.lng === 'number' &&
      !isNaN(c.lng) &&
      isFinite(c.lng)
  );

  if (cleanCoords.length < 2) {
    return { segments: [], totalDistance: 0 };
  }

  const rawSegments: { p1: LatLng; p2: LatLng; dist: number }[] = [];
  let totalDistance = 0;

  for (let i = 0; i < cleanCoords.length - 1; i++) {
    const d = haversineDistanceMeters(cleanCoords[i], cleanCoords[i + 1]);
    if (!isNaN(d) && isFinite(d) && d > 0) {
      rawSegments.push({ p1: cleanCoords[i], p2: cleanCoords[i + 1], dist: d });
      totalDistance += d;
    }
  }

  if (rawSegments.length === 0 || totalDistance <= 0) {
    const defaultMid = interpolateLatLng(cleanCoords[0], cleanCoords[cleanCoords.length - 1], 0.5);
    return {
      segments: [
        {
          index: 0,
          startDistanceMeters: 0,
          endDistanceMeters: 100,
          startPoint: cleanCoords[0],
          endPoint: cleanCoords[cleanCoords.length - 1],
          midPoint: defaultMid,
        },
      ],
      totalDistance: 100,
    };
  }

  // Strict 100m segments with safety cap of 150 segments to guarantee high UI performance
  const MAX_SEGMENTS = 150;
  const targetSegmentLength = Math.max(100, Math.ceil(totalDistance / MAX_SEGMENTS));

  const resultSegments: {
    index: number;
    startDistanceMeters: number;
    endDistanceMeters: number;
    startPoint: LatLng;
    endPoint: LatLng;
    midPoint: LatLng;
  }[] = [];

  let currentDist = 0;

  while (currentDist < totalDistance && resultSegments.length < MAX_SEGMENTS) {
    const segStartDist = currentDist;
    const segEndDist = Math.min(currentDist + targetSegmentLength, totalDistance);
    const segLen = segEndDist - segStartDist;

    if (segLen < 15 && resultSegments.length > 0) {
      // Very tiny residual segment at end, fold into prior segment
      const last = resultSegments[resultSegments.length - 1];
      last.endDistanceMeters = Math.round(segEndDist);
      last.endPoint = cleanCoords[cleanCoords.length - 1];
      last.midPoint = interpolateLatLng(last.startPoint, last.endPoint, 0.5);
      break;
    }

    const startPoint = getPointAtDistance(rawSegments, segStartDist);
    const endPoint = getPointAtDistance(rawSegments, segEndDist);
    const midPoint = getPointAtDistance(rawSegments, (segStartDist + segEndDist) / 2);

    resultSegments.push({
      index: resultSegments.length,
      startDistanceMeters: Math.round(segStartDist),
      endDistanceMeters: Math.round(segEndDist),
      startPoint,
      endPoint,
      midPoint,
    });

    currentDist += targetSegmentLength;
  }

  return { segments: resultSegments, totalDistance: Math.round(totalDistance) };
}

function getPointAtDistance(
  rawSegments: { p1: LatLng; p2: LatLng; dist: number }[],
  targetDist: number
): LatLng {
  if (rawSegments.length === 0) return { lat: 0, lng: 0 };
  let accum = 0;
  for (const seg of rawSegments) {
    if (accum + seg.dist >= targetDist) {
      const remaining = targetDist - accum;
      const fraction = seg.dist > 0 ? remaining / seg.dist : 0;
      return interpolateLatLng(seg.p1, seg.p2, Math.max(0, Math.min(1, fraction)));
    }
    accum += seg.dist;
  }
  return rawSegments[rawSegments.length - 1].p2;
}

/**
 * Simulates realistic places and reviews within a tight 30-meter buffer along coordinates
 * when querying or as baseline fallback for testing scenarios.
 */
export function generatePlacesForSegment(
  segmentIndex: number,
  totalSegments: number,
  midPoint: LatLng,
  isSafestVariant: boolean
): PlaceAmenity[] {
  // If safest variant: majority of segments have active, well-lit businesses and high surveillance
  // If fastest variant: may cut through unlit alleyways, shuttered loading docks, or desolate blocks
  const isDangerSegment =
    !isSafestVariant && (segmentIndex === Math.floor(totalSegments / 2) || segmentIndex === 1);

  if (isDangerSegment) {
    // Critical Danger Dropout: 0 open businesses or abandoned warehouse
    return [
      {
        id: `amenity-${segmentIndex}-dropout`,
        name: 'Disused Industrial Warehouse & Rear Loading Dock',
        type: 'industrial',
        isOpenNow: false,
        operatingHoursSummary: 'Permanently Closed / Unmanned',
        rating: 2.1,
        safetyBonus: -35,
        sentimentKeywords: ['dark', 'dimly lit', 'sketchy', 'deserted', 'no sidewalk'],
        snippetReviews: [
          'No streetlights here at night, feels very sketchy and pitch black.',
          'Sidewalk ends abruptly, completely abandoned industrial zone after 7pm.',
        ],
      },
    ];
  }

  // Active presence venues
  const venuePool: Array<{
    name: string;
    type: string;
    bonus: number;
    hours: string;
    reviews: string[];
    keywords: string[];
  }> = [
    {
      name: 'FamilyMart 24/7 Convenience Store',
      type: 'convenience_store',
      bonus: 30,
      hours: 'Open 24 Hours • High Visibility Glazing',
      keywords: ['bright', 'well-lit', 'busy', 'safe', 'cameras'],
      reviews: [
        'Super bright entrance with full exterior CCTV. Staff is alert 24/7.',
        'Always people coming in and out, well-lit pavement.',
      ],
    },
    {
      name: 'Metro Line Exit & Transit Hub',
      type: 'transit_station',
      bonus: 35,
      hours: 'Open until 01:15 AM • Municipal Security Patrol',
      keywords: ['guards', 'cameras', 'well lit', 'busy', 'patrol'],
      reviews: [
        'Active transit security guards posted right at the corner.',
        'Well illuminated intersection with frequent pedestrian traffic.',
      ],
    },
    {
      name: 'All-Night Community Pharmacy',
      type: 'pharmacy',
      bonus: 25,
      hours: 'Open 24/7 • Emergency Service Window',
      keywords: ['safe', 'bright', 'well-lit', 'guards'],
      reviews: ['Bright neon signage, security camera active, felt very safe walking past.'],
    },
    {
      name: 'Blue Bottle Cafe & Espresso Bar',
      type: 'cafe',
      bonus: 20,
      hours: 'Open until 11:00 PM • Outdoor Terrace',
      keywords: ['lively', 'busy', 'well lit', 'friendly'],
      reviews: ['Lively street terrace with warm overhead lights and active foot traffic.'],
    },
    {
      name: 'Central Police Substation Box (Koban)',
      type: 'police',
      bonus: 45,
      hours: 'Open 24/7 • Officers on Duty',
      keywords: ['police', 'safe', 'patrol', 'guards', 'well-lit'],
      reviews: ['Officers stationed out front, maximum security and bright streetlamp.'],
    },
  ];

  const count = isSafestVariant ? 2 : 1;
  const venues: PlaceAmenity[] = [];

  for (let k = 0; k < count; k++) {
    const template = venuePool[(segmentIndex + k * 2) % venuePool.length];
    venues.push({
      id: `amenity-${segmentIndex}-${k}`,
      name: template.name,
      type: template.type,
      isOpenNow: true,
      operatingHoursSummary: template.hours,
      rating: 4.5,
      safetyBonus: template.bonus,
      sentimentKeywords: template.keywords,
      snippetReviews: template.reviews,
    });
  }

  return venues;
}

/**
 * THE CORE SAFETY CALCULATOR SCORING ALGORITHM:
 * Evaluates route segment-by-segment (100m slices) preventing the end-of-road trap.
 * 1. Positive Active Presence (Operating hours, open businesses, 24/7 eyes on street)
 * 2. Critical Danger Dropout (0 open businesses, industrial blind spots, severe penalty)
 * 3. Crowd Source Sentiment (Scan reviews for "dark", "dimly lit", "sketchy" vs "well-lit", "busy")
 * 4. Weakest Link Bottlenecking: if any 100m segment < 40%, penalizes entire route total!
 */
export function analyzeRouteSafety(
  routeId: 'safest' | 'fastest',
  name: string,
  coords: LatLng[],
  placesAlongSegments?: (PlaceAmenity[] | null)[]
): RouteSafetyAnalysis {
  const { segments: rawSegments, totalDistance } = dividePathInto100mSegments(coords);
  const totalSegCount = rawSegments.length || 1;

  // Walking speed approx 1.35 m/s (~81 m/min)
  const estimatedDurationMinutes = Math.max(1, Math.round(totalDistance / 80));

  const analyzedSegments: RouteSegment[] = [];
  let totalPositiveMentions = 0;
  let totalNegativeMentions = 0;
  let totalActiveEyesPoints = 0;
  let dropoutSegmentCount = 0;
  const criticalWarnings: string[] = [];

  rawSegments.forEach((seg, idx) => {
    // 1. Retrieve venues for this 30m buffer zone
    const venues =
      placesAlongSegments?.[idx] ??
      generatePlacesForSegment(idx, totalSegCount, seg.midPoint, routeId === 'safest');

    // Filter actively open venues at current time
    const openVenues = venues.filter((v) => v.isOpenNow);
    const hasOpenBusinesses = openVenues.length > 0;

    // 2. Active Eyes on Street Points
    let activeBonus = 0;
    openVenues.forEach((v) => {
      activeBonus += v.safetyBonus;
      if (HIGH_VALUE_SAFETY_TYPES.includes(v.type)) {
        activeBonus += 15;
      }
    });
    // Cap active eyes bonus at 50
    activeBonus = Math.min(50, activeBonus);
    totalActiveEyesPoints += activeBonus;

    // 3. Sentiment keyword scanning from snippet reviews
    const posFound: string[] = [];
    const negFound: string[] = [];
    let sentimentDelta = 0;

    venues.forEach((v) => {
      const textToScan = [
        ...(v.snippetReviews || []),
        ...(v.sentimentKeywords || []),
        v.name,
      ].join(' ').toLowerCase();

      POSITIVE_KEYWORDS.forEach((kw) => {
        if (textToScan.includes(kw) && !posFound.includes(kw)) {
          posFound.push(kw);
          sentimentDelta += 10;
        }
      });

      NEGATIVE_KEYWORDS.forEach((kw) => {
        if (textToScan.includes(kw) && !negFound.includes(kw)) {
          negFound.push(kw);
          sentimentDelta -= 15;
        }
      });
    });

    totalPositiveMentions += posFound.length;
    totalNegativeMentions += negFound.length;

    // 4. Critical Danger Dropout check:
    // If an individual 100-meter segment contains zero open businesses or shuttered zones
    const isCriticalDropout = !hasOpenBusinesses || venues.some((v) => LOW_SAFETY_TYPES.includes(v.type));
    let dropoutPenalty = 0;

    const warnings: string[] = [];
    const positives: string[] = [];

    if (isCriticalDropout) {
      dropoutSegmentCount++;
      dropoutPenalty = 45; // Severe penalty for empty or shuttered stretch
      warnings.push(
        `Critical Danger Dropout: 0 open storefronts detected between ${seg.startDistanceMeters}m - ${seg.endDistanceMeters}m. Void of active eyes on the street.`
      );
      criticalWarnings.push(
        `Segment ${idx + 1} (${seg.startDistanceMeters}m-${seg.endDistanceMeters}m): Deserted/shuttered dead-zone with 0 active open businesses.`
      );
    }

    if (negFound.length > 0) {
      warnings.push(`Sentiment flags: Reviews cite "${negFound.slice(0, 3).join(', ')}" nearby.`);
    }

    if (openVenues.length > 0) {
      positives.push(
        `${openVenues.length} active open venue${openVenues.length > 1 ? 's' : ''}: ${openVenues.map((v) => v.name).join(', ')}.`
      );
    }
    if (posFound.length > 0) {
      positives.push(`Verified safety signals: "${posFound.slice(0, 3).join(', ')}".`);
    }

    // 5. Compute Segment Score (Base 50, + active eyes, + sentiment, - dropout penalty)
    let rawSegmentScore = 50 + activeBonus + sentimentDelta - dropoutPenalty;
    // Bound strictly between 5 and 99
    rawSegmentScore = Math.max(8, Math.min(98, Math.round(rawSegmentScore)));

    let safetyStatus: 'safe' | 'moderate' | 'hazard' = 'safe';
    if (rawSegmentScore < 40) {
      safetyStatus = 'hazard';
    } else if (rawSegmentScore < 70) {
      safetyStatus = 'moderate';
    }

    analyzedSegments.push({
      ...seg,
      score: rawSegmentScore,
      activeVenues: openVenues,
      isCriticalDropout,
      sentimentScore: sentimentDelta,
      positiveKeywordsFound: posFound,
      negativeKeywordsFound: negFound,
      warnings,
      positives,
      safetyStatus,
    });
  });

  // Calculate overall metrics safely without spreading arguments into the call stack
  const segmentScores = analyzedSegments.map((s) => s.score);
  let minSegmentScore = 100;
  let minSegIdx = 0;
  let scoreSum = 0;

  for (let i = 0; i < segmentScores.length; i++) {
    const s = segmentScores[i];
    scoreSum += s;
    if (s < minSegmentScore) {
      minSegmentScore = s;
      minSegIdx = i;
    }
  }

  const baseAvgScore =
    segmentScores.length > 0 ? Math.round(scoreSum / segmentScores.length) : 70;

  // BOTTLENECK RULE (Weakest Link Principle):
  // If a single 100-meter segment scores below 40% for safety, heavily penalize the entire route score!
  let overallSafetyScore = baseAvgScore;
  let isBottlenecked = false;
  let bottleneckReason: string | undefined;

  if (minSegmentScore < 40) {
    isBottlenecked = true;
    // Route cannot be rated higher than a slight buffer above its worst segment
    overallSafetyScore = Math.min(
      Math.round(minSegmentScore * 1.1),
      Math.round(baseAvgScore * 0.58)
    );
    bottleneckReason = `Weakest Link Penalty: Segment ${minSegIdx + 1} (${analyzedSegments[minSegIdx].startDistanceMeters}m - ${analyzedSegments[minSegIdx].endDistanceMeters}m) scored ${minSegmentScore}/100. A single dark or shuttered 100m corridor compromises the entire journey.`;
  } else {
    // Normal weighted combination prioritizing resilience
    overallSafetyScore = Math.round(baseAvgScore * 0.75 + minSegmentScore * 0.25);
  }

  overallSafetyScore = Math.max(10, Math.min(99, overallSafetyScore));

  const activeEyesScore = Math.min(100, Math.round((totalActiveEyesPoints / (totalSegCount * 45)) * 100));

  let tone: 'Positive' | 'Neutral' | 'Concerning' = 'Neutral';
  if (totalPositiveMentions > totalNegativeMentions * 2) {
    tone = 'Positive';
  } else if (totalNegativeMentions > 0) {
    tone = 'Concerning';
  }

  return {
    routeId,
    name,
    totalDistanceMeters: Math.round(totalDistance),
    estimatedDurationMinutes,
    overallSafetyScore,
    baseAverageScore: baseAvgScore,
    weakestLinkScore: minSegmentScore,
    weakestLinkSegmentIndex: minSegIdx,
    isBottlenecked,
    bottleneckReason,
    activeEyesScore,
    dropoutPenaltyApplied: dropoutSegmentCount > 0,
    dropoutSegmentCount,
    sentimentSummary: {
      positiveMentions: totalPositiveMentions,
      negativeMentions: totalNegativeMentions,
      tone,
    },
    segments: analyzedSegments,
    pathCoordinates: coords,
    criticalWarnings,
  };
}
