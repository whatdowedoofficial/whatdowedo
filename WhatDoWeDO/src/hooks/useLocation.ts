import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../types/event';
import { DEFAULT_LOCATION } from '../constants';

// Fallback coordinates for known Italian cities
const KNOWN_CITIES: Record<string, Coordinates> = {
  'milano': { latitude: 45.4642, longitude: 9.1900 },
  'roma': { latitude: 41.9028, longitude: 12.4964 },
  'torino': { latitude: 45.0703, longitude: 7.6869 },
  'firenze': { latitude: 43.7696, longitude: 11.2558 },
  'napoli': { latitude: 40.8518, longitude: 14.2681 },
  'bologna': { latitude: 44.4949, longitude: 11.3426 },
  'venezia': { latitude: 45.4408, longitude: 12.3155 },
  'palermo': { latitude: 38.1157, longitude: 13.3615 },
  'genova': { latitude: 44.4056, longitude: 8.9463 },
  'bari': { latitude: 41.1171, longitude: 16.8719 },
};

interface UseLocationReturn {
  location: Coordinates;
  loading: boolean;
  error: string | null;
  requestGPS: () => Promise<void>;
  searchLocation: (query: string) => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Coordinates>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestGPS = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permesso GPS negato');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err: any) {
      setError(err.message || 'Errore GPS');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchLocation = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    // Check known cities first (instant, no API needed)
    const known = KNOWN_CITIES[query.trim().toLowerCase()];
    if (known) {
      setLocation(known);
      setLoading(false);
      return;
    }

    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        setLocation({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });
      } else {
        setError('Luogo non trovato');
      }
    } catch (err: any) {
      // If geocoding fails, try partial match on known cities
      const partial = Object.entries(KNOWN_CITIES).find(([key]) =>
        key.includes(query.trim().toLowerCase()) || query.trim().toLowerCase().includes(key)
      );
      if (partial) {
        setLocation(partial[1]);
      } else {
        setError(err.message || 'Errore ricerca');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Try GPS on first mount
  useEffect(() => {
    requestGPS();
  }, []);

  return { location, loading, error, requestGPS, searchLocation };
}
