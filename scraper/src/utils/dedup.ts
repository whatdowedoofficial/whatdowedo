import { createHash } from 'crypto';
import type { ScrapedEvent } from '../types.js';

/**
 * Generate a deterministic external_id for deduplication.
 * Based on: source_name + title + start_time + venue (all normalized).
 */
export function generateExternalId(event: ScrapedEvent): string {
  const normalize = (s: string | null | undefined) =>
    (s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');

  const input = [
    normalize(event.source_name),
    normalize(event.title),
    normalize(event.start_time),
    normalize(event.venue_name),
  ].join('|');

  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

/**
 * Assign external_id to all events that don't have one.
 */
export function assignExternalIds(events: ScrapedEvent[]): ScrapedEvent[] {
  return events.map(event => ({
    ...event,
    external_id: event.external_id || generateExternalId(event),
  }));
}
