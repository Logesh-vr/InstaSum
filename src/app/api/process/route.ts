// ─────────────────────────────────────────────────────────────
//  POST /api/process
//  Core pipeline: URL → Apify transcript → OpenAI analysis → Supabase
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { transcribeVideo } from '@/lib/apify';
import { analyzeTranscript } from '@/lib/openai';
import { detectPlatform, isValidVideoUrl } from '@/lib/platforms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string = (body.url || '').trim();

    // ── 1. Validate URL ───────────────────────────────────────
    if (!url) {
      return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
    }

    if (!isValidVideoUrl(url)) {
      return NextResponse.json(
        {
          error:
            'Unsupported URL. Please paste an Instagram Reel, YouTube Short, or TikTok link.',
        },
        { status: 400 }
      );
    }

    // ── 2. Duplicate check ────────────────────────────────────
    const { data: existing } = await supabaseAdmin
      .from('videos')
      .select('id, summary, video_title')
      .eq('source_url', url)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: 'duplicate',
          message: `"${existing.video_title || 'This video'}" is already in your knowledge base.`,
          videoId: existing.id,
        },
        { status: 409 }
      );
    }

    const platform = detectPlatform(url);

    // ── 3. Apify transcript extraction ────────────────────────
    let apifyResult;
    try {
      apifyResult = await transcribeVideo(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Transcript extraction failed: ${msg}` },
        { status: 422 }
      );
    }

    // ── 4. Fetch existing categories from DB ──────────────────
    const { data: catRows } = await supabaseAdmin
      .from('categories')
      .select('name')
      .order('created_at', { ascending: true });

    const existingCategories = (catRows || []).map((c) => c.name as string);

    // ── 5. OpenAI analysis ────────────────────────────────────
    let analysis;
    try {
      analysis = await analyzeTranscript(
        apifyResult.transcript,
        existingCategories
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `AI analysis failed: ${msg}` },
        { status: 422 }
      );
    }

    // ── 6. Upsert category (reuse existing or create new) ────
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .upsert({ name: analysis.category }, { onConflict: 'name' })
      .select('id, name')
      .single();

    if (catError || !category) {
      return NextResponse.json(
        { error: `Failed to save category: ${catError?.message}` },
        { status: 500 }
      );
    }

    // ── 7. Insert video record ────────────────────────────────
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .insert({
        source_url: url,
        platform,
        video_title: apifyResult.videoTitle || null,
        thumbnail_url: apifyResult.thumbnailUrl || null,
        raw_transcript: apifyResult.transcript,
        summary: analysis.summary,
        key_takeaways: analysis.keyTakeaways,
        category_id: category.id,
        processing_status: 'done',
      })
      .select('*, categories(name)')
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: `Failed to save video: ${videoError?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, video }, { status: 201 });
  } catch (err) {
    console.error('[/api/process] Unexpected error:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
