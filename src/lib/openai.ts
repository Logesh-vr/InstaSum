// ─────────────────────────────────────────────────────────────
//  OpenAI intelligence layer
//  Model: gpt-4o-mini — cheap, fast, structured JSON output
// ─────────────────────────────────────────────────────────────

import OpenAI from 'openai';

// Singleton — reused across requests
let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export interface AnalysisResult {
  summary: string;
  keyTakeaways: string[];
  category: string;
}

/**
 * Analyzes a raw video transcript and returns a structured summary.
 *
 * @param transcript      Raw transcript text from Apify
 * @param existingCategories  Array of category names already in the DB
 */
export async function analyzeTranscript(
  transcript: string,
  existingCategories: string[]
): Promise<AnalysisResult> {
  const client = getClient();

  const categoryContext =
    existingCategories.length > 0
      ? `The existing categories in the knowledge base are: ${existingCategories.map((c) => `"${c}"`).join(', ')}. If the video clearly fits one of these, reuse it exactly (same spelling and casing). If it represents a genuinely new topic, create a new 1–2 word category.`
      : `There are no existing categories yet. Create a new concise 1–2 word category for this video.`;

  const systemPrompt = `You are an expert knowledge curator for a personal learning library. You analyze raw transcripts from short-form videos (Instagram Reels, YouTube Shorts, TikTok) and extract structured insights.

${categoryContext}

Rules:
- Categories must be 1–2 words, highly specific, and title-cased (e.g., "UI Design", "Python", "LinkedIn", "SEO Tips", "Productivity").
- The summary must be a clean, jargon-free paragraph of 2–4 sentences describing the core insight.
- Key takeaways must be 3–6 actionable bullet points.
- Ignore filler content (calls to action like "follow for more", "like and subscribe", etc.).

Respond ONLY with a valid JSON object matching this exact shape:
{
  "summary": "string",
  "keyTakeaways": ["string", "string", ...],
  "category": "string"
}`;

  const userMessage = `Here is the raw transcript from a short-form video:\n\n---\n${transcript.slice(0, 8000)}\n---\n\nExtract the insights.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 800,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned an empty response.');

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(raw) as AnalysisResult;
  } catch {
    throw new Error(`OpenAI response was not valid JSON: ${raw}`);
  }

  // Validate shape
  if (
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.keyTakeaways) ||
    typeof parsed.category !== 'string'
  ) {
    throw new Error(`OpenAI response has unexpected structure: ${raw}`);
  }

  return parsed;
}
