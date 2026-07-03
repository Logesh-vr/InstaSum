// ─────────────────────────────────────────────────────────────
//  Apify integration — Video transcript extraction
//
//  Actor used:
//    scrapier/tiktok-instagram-facebook-youtube-shorts-transcriber
//  Supports: Instagram Reels, YouTube Shorts, TikTok
//
//  Apify free tier: $5/month ≈ 165 videos/month
// ─────────────────────────────────────────────────────────────

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN!;
const ACTOR_ID = 'scrapier~tiktok-instagram-facebook-youtube-shorts-transcriber';
const APIFY_BASE = 'https://api.apify.com/v2';

// Max time to wait for Apify to finish (ms)
const MAX_WAIT_MS = 300_000; // 5 minutes
const POLL_INTERVAL_MS = 3_000;

export interface ApifyResult {
  transcript: string;
  videoTitle?: string;
  thumbnailUrl?: string;
}

/**
 * Runs the Apify transcription actor for a given video URL,
 * polls until completion, and returns the cleaned transcript.
 */
export async function transcribeVideo(videoUrl: string): Promise<ApifyResult> {
  if (!APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set in environment variables.');
  }

  // ── Step 1: Start the actor run ────────────────────────────
  const startRes = await fetch(
    `${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${APIFY_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_urls: [{ url: videoUrl }],
        include_timestamps: false,
        language: 'auto',
      }),
    }
  );

  if (!startRes.ok) {
    const body = await startRes.text();
    throw new Error(`Apify run failed to start: ${startRes.status} — ${body}`);
  }

  const { data: runData } = await startRes.json();
  const runId: string = runData.id;

  // ── Step 2: Poll for completion ────────────────────────────
  const deadline = Date.now() + MAX_WAIT_MS;
  let finished = false;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await fetch(
      `${APIFY_BASE}/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    );

    if (!statusRes.ok) continue;

    const { data: statusData } = await statusRes.json();
    const status: string = statusData.status;

    if (status === 'SUCCEEDED') {
      finished = true;
      break;
    }

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(
        `Apify actor run ${status.toLowerCase()} for URL: ${videoUrl}`
      );
    }
    // RUNNING or READY — keep polling
  }

  if (!finished) {
    throw new Error(`Apify actor run timed out after ${MAX_WAIT_MS / 1000} seconds for URL: ${videoUrl}`);
  }

  // ── Step 3: Fetch the dataset items ───────────────────────
  const datasetRes = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}&format=json`
  );

  if (!datasetRes.ok) {
    throw new Error(`Failed to fetch Apify dataset: ${datasetRes.status}`);
  }

  const items: ApifyDatasetItem[] = await datasetRes.json();

  if (!items || items.length === 0) {
    throw new Error(
      'Apify returned no data. The video may be private or unsupported.'
    );
  }

  const item = items[0];

  // Handle explicit errors returned by the actor
  if (item.status === 'failed' && item.error) {
    const cleanError = item.error
      .replace(/\u001b\[\d+(;\d+)*m/g, '') // remove ANSI color escape codes
      .replace(/^ERROR:\s*/i, '') // remove leading "ERROR:"
      .trim();
    throw new Error(`Apify failed to process video: ${cleanError}`);
  }

  const transcript = extractTranscript(item);

  if (!transcript || transcript.trim().length < 20) {
    throw new Error(
      'Transcript is empty or too short. The video may have no speech.'
    );
  }

  return {
    transcript,
    videoTitle: item.title || item.videoTitle || undefined,
    thumbnailUrl: item.thumbnail || item.thumbnailUrl || undefined,
  };
}

// ── Internal helpers ───────────────────────────────────────

interface ApifyDatasetItem {
  transcript?: string;
  text?: string;
  transcription?: string;
  title?: string;
  videoTitle?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  status?: string;
  error?: string;
  [key: string]: unknown;
}

function extractTranscript(item: ApifyDatasetItem): string {
  // Different actor versions may use different field names
  // Use unknown type to avoid TypeScript narrowing issue
  const raw: unknown =
    (item.transcript as unknown) ??
    (item.text as unknown) ??
    (item.transcription as unknown) ??
    '';

  if (typeof raw === 'string') return raw.trim();

  // Some actors return transcript as array of segments
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((seg: unknown) => {
        if (typeof seg === 'string') return seg;
        if (typeof seg === 'object' && seg !== null) {
          const s = seg as Record<string, unknown>;
          return String(s.text || s.transcript || '');
        }
        return '';
      })
      .join(' ')
      .trim();
  }

  return '';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
