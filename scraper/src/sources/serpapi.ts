import axios from 'axios';
import type { ScrapedEvent, EventCategory } from '../types.js';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPAPI_URL = 'https://serpapi.com/search.json';

const QUERIES = [
  { q: 'eventi Milano questa settimana', city: 'Milano' },
  { q: 'concerti Milano', city: 'Milano' },
  { q: 'eventi Roma questa settimana', city: 'Roma' },
  { q: 'concerti Roma', city: 'Roma' },
  { q: 'eventi Torino questa settimana', city: 'Torino' },
  { q: 'eventi Firenze questa settimana', city: 'Firenze' },
  { q: 'eventi Napoli questa settimana', city: 'Napoli' },
  { q: 'eventi Bologna questa settimana', city: 'Bologna' },
];

function guessCategory(title: string, description: string): EventCategory {
  const text = `${title} ${description}`.toLowerCase();
  if (text.match(/concerto|musica|live|dj|festival musicale|jazz|rock|rap/)) return 'musica';
  if (text.match(/cinema|film|proiezione|movie/)) return 'cinema';
  if (text.match(/mostra|museo|galleria|arte|exhibition/)) return 'cultura';
  if (text.match(/mercato|mercatino|fiera|vintage/)) return 'mercato';
  if (text.match(/sport|partita|calcio|basket|running|maratona/)) return 'sport';
  if (text.match(/club|disco|nightlife|serata|party|aperitivo/)) return 'nightlife';
  if (text.match(/food|cibo|gastronomia|degustazione|vino|birra|street food/)) return 'food';
  if (text.match(/teatro|spettacolo|opera|musical|commedia/)) return 'teatro';
  return 'altro';
}

/**
 * Fetch events from Google via SerpAPI.
 * Uses the Google Events engine which returns structured event data.
 */
export async function scrapeSerpApi(): Promise<ScrapedEvent[]> {
  if (!SERPAPI_KEY) {
    console.warn('  [SERP] No SERPAPI_KEY set, skipping SerpAPI source');
    return [];
  }

  const allEvents: ScrapedEvent[] = [];

  for (const query of QUERIES) {
    console.log(`  [SERP] Searching: "${query.q}"...`);

    try {
      const response = await axios.get(SERPAPI_URL, {
        params: {
          engine: 'google_events',
          q: query.q,
          hl: 'it',
          gl: 'it',
          api_key: SERPAPI_KEY,
        },
        timeout: 15000,
      });

      const eventsResults = response.data.events_results ?? [];

      for (const ge of eventsResults) {
        const event: ScrapedEvent = {
          title: ge.title ?? 'Evento',
          description: ge.description?.slice(0, 300) ?? null,
          category: guessCategory(ge.title ?? '', ge.description ?? ''),
          venue_name: ge.venue?.name ?? null,
          address: ge.address?.[0] ?? null,
          city: query.city,
          lat: ge.venue?.lat ?? null,
          lng: ge.venue?.lng ?? null,
          start_time: ge.date?.start_date ?? new Date().toISOString(),
          end_time: ge.date?.end_date ?? null,
          price_info: ge.ticket_info?.[0]?.price ?? null,
          source_url: ge.link ?? ge.venue?.link ?? null,
          source_name: 'Google Events',
          image_url: ge.thumbnail ?? null,
          external_id: '', // Will be set by dedup
        };

        allEvents.push(event);
      }

      console.log(`  [SERP] Found ${eventsResults.length} events for "${query.q}"`);
    } catch (error: any) {
      console.error(`  [SERP] Error searching "${query.q}":`, error.message);
    }

    // Respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return allEvents;
}
