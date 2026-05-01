import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractEventsFromText } from '../ai/gemini.js';
import type { ScrapedEvent } from '../types.js';

/**
 * Fetch recent messages from a public Telegram channel via web preview.
 */
async function fetchChannelMessages(channel: string): Promise<string[]> {

  const url = `https://t.me/s/${channel}`;
  console.log(`  [TG] Fetching web preview: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    });

    // Check if the page is just a redirect stub (no message content)
    if (typeof response.data !== 'string') {
      console.warn(`  [TG] Channel @${channel} returned non-HTML response`);
      return [];
    }

    // Extract message texts from the web preview HTML
    const $ = cheerio.load(response.data);

    // If there are no message widgets, it's not a public preview page
    const messageWidgets = $('.tgme_widget_message_text');
    if (messageWidgets.length === 0) {
      console.warn(`  [TG] Channel @${channel} has no messages or is private`);
      return [];
    }

    const messages: string[] = [];
    $('.tgme_widget_message_text').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        messages.push(text);
      }
    });

    console.log(`  [TG] Found ${messages.length} messages from @${channel}`);
    return messages;
  } catch (error: any) {
    console.error(`  [TG] Error fetching @${channel}:`, error.message);
    return [];
  }
}

/**
 * Scrape events from Telegram public channels.
 */
export async function scrapeTelegram(channels: string[]): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  for (const channel of channels) {
    const messages = await fetchChannelMessages(channel);

    if (messages.length === 0) continue;

    // Combine messages into a single text block for AI extraction
    const combinedText = messages.join('\n\n---\n\n').slice(0, 4000);

    console.log(`  [TG] Sending ${combinedText.length} chars to AI for @${channel}...`);

    const events = await extractEventsFromText(
      combinedText,
      `https://t.me/${channel}`,
      `Telegram @${channel}`
    );

    console.log(`  [TG] AI extracted ${events.length} events from @${channel}`);
    allEvents.push(...events);

    // Small delay between channels
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return allEvents;
}
