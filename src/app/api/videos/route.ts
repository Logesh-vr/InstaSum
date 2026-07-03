// ─────────────────────────────────────────────────────────────
//  GET /api/videos
//  Returns paginated video records joined with category name.
//  Query params: ?category=<name>&search=<text>&page=<n>
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabaseAdmin
      .from('videos')
      .select(
        `
        id, source_url, platform, video_title, thumbnail_url,
        summary, key_takeaways, processing_status, created_at,
        categories ( id, name )
      `,
        { count: 'exact' }
      )
      .eq('processing_status', 'done')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category) {
      // Filter by category name (join)
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', category)
        .single();

      if (cat) {
        query = query.eq('category_id', cat.id);
      } else {
        // No such category — return empty
        return NextResponse.json({ videos: [], total: 0, page, pageSize });
      }
    }

    if (search) {
      query = query.or(
        `video_title.ilike.%${search}%,summary.ilike.%${search}%`
      );
    }

    const { data: videos, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      videos: videos || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[/api/videos] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch videos.' },
      { status: 500 }
    );
  }
}
