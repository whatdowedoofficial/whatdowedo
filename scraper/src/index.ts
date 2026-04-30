import 'dotenv/config';
import sources from './config/sources.json';
import { scrapeWebSource } from './sources/webscraper.js';
import { scrapeEventbrite } from './sources/eventbrite.js';
import { scrapeSerpApi } from './sources/serpapi.js';
import { geocodeAddress } from './utils/geocode.js';
import { assignExternalIds } from './utils/dedup.js';
import { upsertEvents, cleanupPastEvents } from './db/supabase.js';
import type { ScrapedEvent, SourceConfig } from './types.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function geocodeEvents(events: ScrapedEvent[]): Promise<ScrapedEvent[]> {
  console.log(`\n[GEOCODE] Geocoding ${events.filter(e => !e.lat).length} events without coordinates...`);

  for (const event of events) {
    if (event.lat && event.lng) continue; // Already has coordinates

    const address = event.address || event.venue_name || '';
    if (!address) continue;

    const result = await geocodeAddress(address, event.city);
    if (result) {
      event.lat = result.lat;
      event.lng = result.lng;
    }
  }

  // Filter out events that couldn't be geocoded
  const geocoded = events.filter(e => e.lat && e.lng);
  const failed = events.length - geocoded.length;
  if (failed > 0) {
    console.log(`[GEOCODE] ${failed} events could not be geocoded and will be skipped`);
  }

  return geocoded;
}

async function main() {
  console.log('='.repeat(60));
  console.log(`WhatDoWeDO Scraper - ${new Date().toISOString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no DB writes)' : 'LIVE'}`);
  console.log('='.repeat(60));

  const allEvents: ScrapedEvent[] = [];

  for (const source of sources as SourceConfig[]) {
    if (!source.enabled) {
      console.log(`\n[SKIP] ${source.name} (disabled)`);
      continue;
    }

    console.log(`\n[SOURCE] Processing: ${source.name} (${source.type})`);

    let events: ScrapedEvent[] = [];

    switch (source.type) {
      case 'web':
        if (source.urls && source.urls.length > 0) {
          events = await scrapeWebSource(source.urls, source.name);
        }
        break;

      case 'eventbrite':
        events = await scrapeEventbrite();
        break;

      case 'serpapi':
        events = await scrapeSerpApi();
        break;

      default:
        console.warn(`  Unknown source type: ${source.type}`);
    }

    console.log(`  -> Found ${events.length} events from ${source.name}`);
    allEvents.push(...events);

    // Delay between sources to respect Groq rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[TOTAL] Raw events collected: ${allEvents.length}`);

  // Assign external IDs for deduplication
  const withIds = assignExternalIds(allEvents);

  // Geocode events without coordinates
  const geocoded = await geocodeEvents(withIds);

  console.log(`[TOTAL] Events with coordinates: ${geocoded.length}`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would upsert the following events:');
    for (const event of geocoded.slice(0, 20)) {
      console.log(`  - ${event.title} | ${event.city} | ${event.start_time} | ${event.category}`);
    }
    if (geocoded.length > 20) {
      console.log(`  ... and ${geocoded.length - 20} more`);
    }
  } else {
    // Upsert to database
    console.log('\n[DB] Upserting events...');
    const result = await upsertEvents(geocoded);
    console.log(`[DB] Inserted/updated: ${result.inserted}, Errors: ${result.errors}`);

    // Cleanup old events
    const cleaned = await cleanupPastEvents();
    if (cleaned > 0) {
      console.log(`[DB] Cleaned up ${cleaned} past events`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
