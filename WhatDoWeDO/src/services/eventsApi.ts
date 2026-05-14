import { supabase } from './supabaseClient';
import type { EventItem } from '../types/event';

interface GetEventsParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  category?: string | null;
  dateFilter?: string | null;
}

export async function getEventsNear(params: GetEventsParams): Promise<EventItem[]> {
  const { latitude, longitude, radiusKm, category, dateFilter } = params;

  const { data, error } = await supabase.rpc('get_events_near', {
    user_lat: latitude,
    user_lng: longitude,
    radius_km: radiusKm,
    category_filter: category ?? null,
    date_filter: dateFilter ?? null,
  });

  if (error) {
    console.error('Error fetching events:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as EventItem[];
}
