import { createClient } from '@supabase/supabase-js';
import type { ScrapedEvent } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Upsert events into the database.
 * Uses external_id for deduplication (ON CONFLICT UPDATE).
 */
export async function upsertEvents(events: ScrapedEvent[]): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;

  for (const event of events) {
    const record = {
      title: event.title,
      description: event.description,
      category: event.category,
      venue_name: event.venue_name,
      address: event.address,
      location: event.lat && event.lng
        ? `SRID=4326;POINT(${event.lng} ${event.lat})`
        : null,
      start_time: event.start_time,
      end_time: event.end_time,
      price_info: event.price_info,
      source_url: event.source_url,
      source_name: event.source_name,
      image_url: event.image_url,
      external_id: event.external_id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('events')
      .upsert(record, { onConflict: 'external_id' });

    if (error) {
      console.error(`  [DB] Error upserting "${event.title}":`, error.message);
      errors++;
    } else {
      inserted++;
    }
  }

  return { inserted, errors };
}

/**
 * Remove events that have already passed (start_time older than N days).
 */
export async function cleanupPastEvents(daysOld: number = 3): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('events')
    .delete()
    .lt('start_time', cutoff)
    .select('id');

  if (error) {
    console.error('[DB] Error cleaning up past events:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Get cached geocode result for an address.
 */
export async function getGeocodeCache(addressQuery: string): Promise<{ lat: number; lng: number } | null> {
  const { data } = await supabase
    .from('geocode_cache')
    .select('lat, lng')
    .eq('address_query', addressQuery)
    .single();

  return data ?? null;
}

/**
 * Save geocode result to cache.
 */
export async function setGeocodeCache(addressQuery: string, lat: number, lng: number, displayName: string): Promise<void> {
  await supabase
    .from('geocode_cache')
    .upsert({ address_query: addressQuery, lat, lng, display_name: displayName });
}
