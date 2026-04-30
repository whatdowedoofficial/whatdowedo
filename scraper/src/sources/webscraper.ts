import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractEventsFromText } from '../ai/gemini.js';
import type { ScrapedEvent } from '../types.js';

/**
 * Scrape a web page and extract events using Gemini AI.
 */
export async function scrapeWebPage(
  url: string,
  sourceName: string
): Promise<ScrapedEvent[]> {
  console.log(`  [WEB] Fetching: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Remove non-content elements
    $('nav, header, footer, script, style, noscript, iframe, .cookie-banner, .ads, .advertisement').remove();

    // Extract meaningful text content
    const textContent = $('main, article, .content, .events, [role="main"], body')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (textContent.length < 100) {
      console.warn(`  [WEB] Page content too short for ${url} (${textContent.length} chars)`);
      return [];
    }

    console.log(`  [WEB] Extracted ${textContent.length} chars, sending to AI...`);

    // Limit text length for AI (Groq max ~6000 chars)
    const safeText = textContent.slice(0, 6000);
    const events = await extractEventsFromText(safeText, url, sourceName);

    console.log(`  [WEB] AI extracted ${events.length} events from ${url}`);
    return events;
  } catch (error: any) {
    console.error(`  [WEB] Error scraping ${url}:`, error.message);
    return [];
  }
}

/**
 * Scrape multiple URLs for a source.
 */
export async function scrapeWebSource(
  urls: string[],
  sourceName: string
): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  for (const url of urls) {
    const events = await scrapeWebPage(url, sourceName);
    allEvents.push(...events);

    // Small delay between pages to be polite
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return allEvents;
}
