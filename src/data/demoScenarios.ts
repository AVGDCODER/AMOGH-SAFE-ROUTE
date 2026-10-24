import { DemoScenario } from '../types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'tokyo-shibuya',
    name: 'Tokyo — Shibuya Night Walk',
    locationName: 'Shibuya, Tokyo',
    originName: 'Shibuya Station Hachiko',
    destinationName: 'Dogenzaka Hillside Hotel',
    origin: { lat: 35.6591, lng: 139.7006 },
    destination: { lat: 35.6565, lng: 139.6952 },
    description: 'Compares vibrant, 24/7 konbini-lined Dogenzaka main boulevard against unmonitored narrow back alleys.',
  },
  {
    id: 'nyc-manhattan',
    name: 'NYC — Times Sq to 9th Ave',
    locationName: 'Manhattan, New York',
    originName: 'Times Square (42nd St)',
    destinationName: 'Hell’s Kitchen (W 47th & 9th Ave)',
    origin: { lat: 40.758, lng: -73.9855 },
    destination: { lat: 40.7618, lng: -73.9912 },
    description: 'Compares high-visibility avenue corridors against desolate side-street construction zones.',
  },
  {
    id: 'london-soho',
    name: 'London — Oxford St to Piccadilly',
    locationName: 'West End, London',
    originName: 'Oxford Circus Station',
    destinationName: 'Piccadilly Circus',
    origin: { lat: 51.5152, lng: -0.1419 },
    destination: { lat: 51.5099, lng: -0.1348 },
    description: 'Compares brightly illuminated Regent Street with quiet, CCTV-blind service mews.',
  },
  {
    id: 'sf-market',
    name: 'San Francisco — Market to Union Sq',
    locationName: 'Downtown San Francisco',
    originName: 'Powell St BART Station',
    destinationName: 'Union Square Plaza',
    origin: { lat: 37.7844, lng: -122.408 },
    destination: { lat: 37.7879, lng: -122.4075 },
    description: 'Compares active commercial Powell corridor with unmonitored rear service alleys.',
  },
];
