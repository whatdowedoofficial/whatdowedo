import axios from 'axios';
import type { GeocodeResult } from '../types.js';
import { getGeocodeCache, setGeocodeCache } from '../db/supabase.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const RATE_LIMIT_MS = 1100; // 1 request per second (Nominatim policy)

let lastRequestTime = 0;

async function rateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Geocode an address string to lat/lng coordinates.
 * Uses cache first, then Nominatim OSM API.
 */
export async function geocodeAddress(
  address: string,
  city?: string | null
): Promise<GeocodeResult | null> {
  // Build query string
  const query = address || (city ?? '');
  if (!query.trim()) return null;

  // Append city to address if not already included
  const fullQuery = city && !address.toLowerCase().includes(city.toLowerCase())
    ? `${address}, ${city}, Italia`
    : `${address}, Italia`;

  // Check cache first
  const cached = await getGeocodeCache(fullQuery);
  if (cached) {
    return { lat: cached.lat, lng: cached.lng, display_name: fullQuery };
  }

  // Rate limit
  await rateLimitWait();

  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: fullQuery,
        format: 'json',
        limit: 1,
        countrycodes: 'it',
      },
      headers: {
        'User-Agent': 'WhatDoWeDO/1.0 (event-aggregator; contact@whatdowedo.it)',
      },
    });

    if (response.data.length === 0) {
      // Fallback: try with just city
      if (city && address !== city) {
        return geocodeAddress(city);
      }
      console.warn(`  [GEO] No results for: ${fullQuery}`);
      return null;
    }

    const result = response.data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Save to cache
    await setGeocodeCache(fullQuery, lat, lng, result.display_name);

    return { lat, lng, display_name: result.display_name };
  } catch (error: any) {
    console.error(`  [GEO] Error geocoding "${fullQuery}":`, error.message);
    return null;
  }
}
