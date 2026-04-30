import { useState, useEffect, useRef } from 'react';
import { getEventsNear } from '../services/eventsApi';
import type { EventItem, Coordinates } from '../types/event';
import { DEFAULT_RADIUS_KM } from '../constants';

interface UseEventsReturn {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEvents(
  location: Coordinates,
  radiusKm: number = DEFAULT_RADIUS_KM,
  category: string | null = null
): UseEventsReturn {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getEventsNear({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm,
        category,
      });
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Errore nel caricamento eventi');
    } finally {
      setLoading(false);
    }
  };

  // Debounced fetch when params change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchEvents();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [location.latitude, location.longitude, radiusKm, category]);

  return { events, loading, error, refetch: fetchEvents };
}
