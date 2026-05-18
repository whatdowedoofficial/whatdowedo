import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractEventsFromText } from '../ai/gemini.js';
import type { ScrapedEvent } from '../types.js';

const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
};

// Max chars per AI call — stays well within token limits
const MAX_CHARS_PER_BATCH = 12000;
// How many pages to paginate back through (each page ~20 messages)
const MAX_PAGES = 3;

/**
 * Parse messages + the "prev" pagination URL from a Telegram web preview page.
 */
function parsePage(html: string): { messages: string[]; prevUrl: string | null } {
  const $ = cheerio.load(html);
  const messages: string[] = [];

  $('.tgme_widget_message_wrap').each((_, wrap) => {
    const parts: string[] = [];

    // Main message text (class has multiple values: "tgme_widget_message_text js-message_text")
    $(wrap).find('[class*="tgme_widget_message_text"]').each((_, el) => {
      // Use html() then strip tags to preserve line breaks from <br>
      const inner = $(el).html() ?? '';
      const text = inner
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .trim();
      if (text.length > 0) parts.push(text);
    });

    // Link preview title + description (often contains event name/details)
    $(wrap).find('.tgme_widget_message_link_preview').each((_, el) => {
      const title = $(el).find('.link_preview_title').text().trim();
      const desc = $(el).find('.link_preview_description').text().trim();
      if (title) parts.push(`[Link: ${title}${desc ? ' – ' + desc : ''}]`);
    });

    const combined = parts.join('\n').trim();
    if (combined.length > 20) messages.push(combined);
  });

  // Extract pagination URL for older messages
  const prevHref = $('link[rel="prev"]').attr('href') ?? null;
  const prevUrl = prevHref ? `https://t.me${prevHref}` : null;

  return { messages, prevUrl };
}

/**
 * Fetch recent messages from a public Telegram channel, paginating back MAX_PAGES.
 */
async function fetchChannelMessages(channel: string): Promise<string[]> {
  let url: string | null = `https://t.me/s/${channel}`;
  const allMessages: string[] = [];
  let page = 0;

  while (url && page < MAX_PAGES) {
    console.log(`  [TG] Fetching page ${page + 1}: ${url}`);
    try {
      const response = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 15000 });

      if (typeof response.data !== 'string') {
        console.warn(`  [TG] Non-HTML response on page ${page + 1}`);
        break;
      }

      const { messages, prevUrl } = parsePage(response.data);

      if (messages.length === 0 && page === 0) {
        console.warn(`  [TG] @${channel} has no readable messages or is private`);
        break;
      }

      console.log(`  [TG] Page ${page + 1}: ${messages.length} messages`);
      // Prepend so chronological order is oldest-first
      allMessages.unshift(...messages);

      url = prevUrl;
      page++;

      if (url) await new Promise(r => setTimeout(r, 1000));
    } catch (error: any) {
      console.error(`  [TG] Error on page ${page + 1} for @${channel}:`, error.message);
      break;
    }
  }

  console.log(`  [TG] Total messages collected from @${channel}: ${allMessages.length}`);
  return allMessages;
}

/**
 * Split messages into batches that fit within MAX_CHARS_PER_BATCH.
 */
function batchMessages(messages: string[]): string[] {
  const batches: string[] = [];
  let current = '';

  for (const msg of messages) {
    const candidate = current ? `${current}\n\n---\n\n${msg}` : msg;
    if (candidate.length > MAX_CHARS_PER_BATCH && current) {
      batches.push(current);
      current = msg;
    } else {
      current = candidate;
    }
  }
  if (current) batches.push(current);
  return batches;
}

/**
 * Scrape events from Telegram public channels.
 */
export async function scrapeTelegram(channels: string[]): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  for (const channel of channels) {
    const messages = await fetchChannelMessages(channel);
    if (messages.length === 0) continue;

    const batches = batchMessages(messages);
    console.log(`  [TG] Processing @${channel} in ${batches.length} batch(es)...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`  [TG] Batch ${i + 1}/${batches.length}: ${batch.length} chars → AI`);

      const events = await extractEventsFromText(
        batch,
        `https://t.me/${channel}`,
        `Telegram @${channel}`
      );

      console.log(`  [TG] Batch ${i + 1}: AI extracted ${events.length} events`);
      allEvents.push(...events);

      // Avoid rate limiting between batches
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Delay between channels
    await new Promise(r => setTimeout(r, 3000));
  }

  return allEvents;
}
