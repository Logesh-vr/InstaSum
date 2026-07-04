// ─────────────────────────────────────────────────────────────
//  Google Gemini intelligence layer
//  Model: gemini-2.0-flash — FREE tier, 1,500 req/day, no card needed
//  Get key at: https://ai.google.dev (takes 30 seconds)
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy singleton — created on first use
let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY is not set. Get a free key at https://ai.google.dev'
      );
    }
    _client = new GoogleGenerativeAI(key);
  }
  return _client;
}

export interface AnalysisResult {
  summary: string;
  keyTakeaways: string[];
  category: string;
}

/**
 * Analyzes a raw video transcript using Gemini and returns structured insights.
 * Drop-in replacement for the OpenAI version — identical function signature.
 *
 * @param transcript         Raw transcript text from Apify
 * @param existingCategories Array of category names already in the DB
 */
export async function analyzeTranscript(
  transcript: string,
  existingCategories: string[]
): Promise<AnalysisResult> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const categoryContext =
    existingCategories.length > 0
      ? `The existing categories in the knowledge base are: ${existingCategories.map((c) => `"${c}"`).join(', ')}. If the video clearly fits one of these, reuse it exactly (same spelling and casing). If it represents a genuinely new topic, create a new 1–2 word category.`
      : `There are no existing categories yet. Create a new concise 1–2 word category for this video.`;

  const prompt = `You are an expert knowledge curator for a personal learning library. You analyze raw transcripts from short-form videos (Instagram Reels, YouTube Shorts, TikTok) and extract structured insights.

${categoryContext}

Rules:
- Categories must be 1–2 words, highly specific, and title-cased (e.g., "UI Design", "Python", "LinkedIn", "SEO Tips", "Productivity").
- The summary must be a clean, jargon-free paragraph of 2–4 sentences describing the core insight.
- Key takeaways must be 3–6 actionable bullet points.
- Ignore filler content (calls to action like "follow for more", "like and subscribe", etc.).

Here is the raw transcript from a short-form video:

---
${transcript.slice(0, 8000)}
---

Respond ONLY with a valid JSON object matching this exact shape, no markdown, no backticks:
{
  "summary": "string",
  "keyTakeaways": ["string", "string", ...],
  "category": "string"
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  if (!raw) throw new Error('Gemini returned an empty response.');

  // Strip any markdown code fences Gemini might add despite instructions
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error(`Gemini response was not valid JSON: ${cleaned}`);
  }

  // Validate shape
  if (
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.keyTakeaways) ||
    typeof parsed.category !== 'string'
  ) {
    throw new Error(`Gemini response has unexpected structure: ${cleaned}`);
  }

  return parsed;
}
