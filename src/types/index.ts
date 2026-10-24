export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceAmenity {
  id: string;
  name: string;
  type: string;
  isOpenNow: boolean;
  operatingHoursSummary?: string;
  rating?: number;
  sentimentKeywords?: string[];
  snippetReviews?: string[];
  safetyBonus: number;
}

export interface RouteSegment {
  index: number;
  startDistanceMeters: number;
  endDistanceMeters: number;
  startPoint: LatLng;
  endPoint: LatLng;
  midPoint: LatLng;
  score: number; // 0 - 100
  activeVenues: PlaceAmenity[];
  isCriticalDropout: boolean; // 0 open businesses / dead zone
  sentimentScore: number; // -100 to +100
  positiveKeywordsFound: string[];
  negativeKeywordsFound: string[];
  warnings: string[];
  positives: string[];
  safetyStatus: 'safe' | 'moderate' | 'hazard';
}

export interface RouteSafetyAnalysis {
  routeId: 'safest' | 'fastest';
  name: string;
  totalDistanceMeters: number;
  estimatedDurationMinutes: number;
  overallSafetyScore: number; // 0 - 100
  baseAverageScore: number;
  weakestLinkScore: number;
  weakestLinkSegmentIndex: number;
  isBottlenecked: boolean;
  bottleneckReason?: string;
  activeEyesScore: number; // 0 - 100
  dropoutPenaltyApplied: boolean;
  dropoutSegmentCount: number;
  sentimentSummary: {
    positiveMentions: number;
    negativeMentions: number;
    tone: 'Positive' | 'Neutral' | 'Concerning';
  };
  segments: RouteSegment[];
  pathCoordinates: LatLng[];
  criticalWarnings: string[];
}

export interface DemoScenario {
  id: string;
  name: string;
  locationName: string;
  originName: string;
  destinationName: string;
  origin: LatLng;
  destination: LatLng;
  description: string;
}
