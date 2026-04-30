import { EXTRACTION_PROMPT } from './prompts.js';
import type { ScrapedEvent, EventCategory } from '../types.js';

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error('Missing GROQ_API_KEY env var');
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callWithRetry(prompt: string): Promise<string> {
  for (const modelName of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          const wait = 10000 * attempt;
          console.log(`  [AI] Waiting ${wait / 1000}s before retry...`);
          await delay(wait);
        }

        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 4096,
          }),
        });

        if (res.status === 429) {
          console.warn(`  [AI] Rate limited on ${modelName}, retrying...`);
          continue;
        }

        if (!res.ok) {
          const errBody = await res.text();
          if (res.status === 503) {
            console.warn(`  [AI] Model ${modelName} unavailable (503), trying next model...`);
            break;
          }
          throw new Error(`Groq API error ${res.status}: ${errBody}`);
        }

        const data = await res.json() as any;
        return data.choices[0].message.content;
      } catch (error: any) {
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          console.warn(`  [AI] Model ${modelName} unavailable, trying next...`);
          break;
        }
        throw error;
      }
    }
  }
  throw new Error('All Groq models unavailable');
}

/**
 * Send page content to Gemini and get structured events back.
 */
export async function extractEventsFromText(
  pageContent: string,
  sourceUrl: string,
  sourceName: string
): Promise<ScrapedEvent[]> {
  const prompt = EXTRACTION_PROMPT
    .replace('{source_url}', sourceUrl)
    .replace('{page_content}', pageContent.slice(0, 30000)); // Limit to ~30k chars

  try {
    const text = await callWithRetry(prompt);

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn(`  [AI] No JSON array found in response for ${sourceUrl}`);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      console.warn(`  [AI] Response is not an array for ${sourceUrl}`);
      return [];
    }

    // Validate and normalize each event
    const validCategories: EventCategory[] = [
      'musica', 'cinema', 'cultura', 'mercato', 'sport',
      'nightlife', 'food', 'teatro', 'altro'
    ];

    return parsed
      .filter((e: any) => e.title && e.start_date)
      .map((e: any) => ({
        title: String(e.title).trim(),
        description: e.description ? String(e.description).trim() : null,
        category: validCategories.includes(e.category) ? e.category : 'altro',
        venue_name: e.venue_name ? String(e.venue_name).trim() : null,
        address: e.address ? String(e.address).trim() : null,
        city: e.city ? String(e.city).trim() : null,
        lat: null, // Will be geocoded later
        lng: null,
        start_time: e.start_date,
        end_time: e.end_date ?? null,
        price_info: e.price_info ? String(e.price_info).trim() : null,
        source_url: sourceUrl,
        source_name: sourceName,
        image_url: e.image_url ?? null,
        external_id: '', // Will be set by dedup
      }));
  } catch (error: any) {
    console.error(`  [AI] Error extracting events from ${sourceUrl}:`, error.message);
    return [];
  }
}
