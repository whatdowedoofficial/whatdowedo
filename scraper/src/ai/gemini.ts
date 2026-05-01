import { EXTRACTION_PROMPT } from './prompts.js';
import type { ScrapedEvent, EventCategory } from '../types.js';

const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) {
  throw new Error('Missing GROQ_API_KEY env var');
}

interface ModelConfig {
  name: string;
  provider: 'groq';
  url: string;
  apiKey: string;
  maxTokens: number;
}

// Models ordered by priority. Round-robin within same priority tier.
const MODEL_POOL: ModelConfig[] = [
  {
    name: 'llama-3.3-70b-versatile',
    provider: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: GROQ_KEY,
    maxTokens: 4096,
  },
  {
    name: 'meta-llama/llama-4-scout-17b-16e-instruct',
    provider: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: GROQ_KEY,
    maxTokens: 4096,
  },
  {
    name: 'llama-3.1-8b-instant',
    provider: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: GROQ_KEY,
    maxTokens: 4096,
  },
];

let callIndex = 0;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function getNextModel(): ModelConfig {
  const model = MODEL_POOL[callIndex % MODEL_POOL.length];
  callIndex++;
  return model;
}

async function callModel(model: ModelConfig, prompt: string): Promise<string> {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.name,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: model.maxTokens,
    }),
  });

  if (res.status === 429) {
    throw new Error(`RATE_LIMITED:${model.name}`);
  }

  if (res.status === 503) {
    throw new Error(`UNAVAILABLE:${model.name}`);
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API error ${res.status} on ${model.name}: ${errBody}`);
  }

  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callWithLoadBalancing(prompt: string): Promise<string> {
  const tried = new Set<string>();

  // Try up to all models in the pool
  for (let i = 0; i < MODEL_POOL.length; i++) {
    const model = getNextModel();

    // Skip if we already tried this model
    if (tried.has(model.name)) continue;
    tried.add(model.name);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`  [AI] Retry ${model.name} after 10s...`);
          await delay(10000);
        }

        const result = await callModel(model, prompt);
        return result;
      } catch (error: any) {
        if (error.message?.startsWith('RATE_LIMITED')) {
          console.warn(`  [AI] Rate limited on ${model.name}, trying next model...`);
          break; // Try next model
        }
        if (error.message?.startsWith('UNAVAILABLE')) {
          console.warn(`  [AI] ${model.name} unavailable, trying next model...`);
          break; // Try next model
        }
        if (attempt === 1) {
          console.warn(`  [AI] ${model.name} failed after retry: ${error.message}`);
          break; // Try next model
        }
      }
    }
  }

  throw new Error('All models exhausted');
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
    const text = await callWithLoadBalancing(prompt);

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
