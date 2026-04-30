import axios from 'axios';
import type { ScrapedEvent, EventCategory } from '../types.js';

const EVENTBRITE_API = 'https://www.eventbriteapi.com/v3';

const apiKey = process.env.EVENTBRITE_API_KEY;

const CITIES = [
  { name: 'Milano', lat: 45.4642, lng: 9.1900 },
  { name: 'Roma', lat: 41.9028, lng: 12.4964 },
  { name: 'Torino', lat: 45.0703, lng: 7.6869 },
  { name: 'Firenze', lat: 43.7696, lng: 11.2558 },
  { name: 'Napoli', lat: 40.8518, lng: 14.2681 },
  { name: 'Bologna', lat: 44.4949, lng: 11.3426 },
];

function mapCategory(ebCategory: string | undefined): EventCategory {
  const map: Record<string, EventCategory> = {
    'Music': 'musica',
    'Film, Media & Entertainment': 'cinema',
    'Arts': 'cultura',
    'Sports & Fitness': 'sport',
    'Food & Drink': 'food',
    'Performing & Visual Arts': 'teatro',
    'Nightlife': 'nightlife',
    'Community & Culture': 'cultura',
  };
  return map[ebCategory ?? ''] ?? 'altro';
}

/**
 * Fetch events from Eventbrite API for all configured cities.
 */
export async function scrapeEventbrite(): Promise<ScrapedEvent[]> {
  if (!apiKey) {
    console.warn('  [EB] No EVENTBRITE_API_KEY set, skipping Eventbrite source');
    return [];
  }

  const allEvents: ScrapedEvent[] = [];

  for (const city of CITIES) {
    console.log(`  [EB] Fetching events for ${city.name}...`);

    try {
      const response = await axios.get(`${EVENTBRITE_API}/events/search`, {
        params: {
          'location.latitude': city.lat,
          'location.longitude': city.lng,
          'location.within': '30km',
          'start_date.range_start': new Date().toISOString().replace('Z', ''),
          'expand': 'venue,category',
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 15000,
      });

      const events = response.data.events ?? [];

      for (const eb of events) {
        const venue = eb.venue;
        const event: ScrapedEvent = {
          title: eb.name?.text ?? 'Evento senza titolo',
          description: eb.description?.text?.slice(0, 300) ?? null,
          category: mapCategory(eb.category?.name),
          venue_name: venue?.name ?? null,
          address: venue?.address?.localized_address_display ?? null,
          city: city.name,
          lat: venue?.latitude ? parseFloat(venue.latitude) : city.lat,
          lng: venue?.longitude ? parseFloat(venue.longitude) : city.lng,
          start_time: eb.start?.utc ?? new Date().toISOString(),
          end_time: eb.end?.utc ?? null,
          price_info: eb.is_free ? 'Gratuito' : (eb.ticket_availability?.minimum_ticket_price?.display ?? null),
          source_url: eb.url ?? null,
          source_name: 'Eventbrite',
          image_url: eb.logo?.url ?? null,
          external_id: `eb-${eb.id}`,
        };

        allEvents.push(event);
      }

      console.log(`  [EB] Found ${events.length} events in ${city.name}`);
    } catch (error: any) {
      console.error(`  [EB] Error fetching ${city.name}:`, error.message);
    }

    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allEvents;
}
