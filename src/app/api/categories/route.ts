// ─────────────────────────────────────────────────────────────
//  GET /api/categories
//  Returns all categories with their video count
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Fetch categories with video count using a join
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, videos(count)')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the count
    const categories = (data || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: Array.isArray(cat.videos) ? (cat.videos[0] as { count: number })?.count ?? 0 : 0,
    }));

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[/api/categories] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories.' },
      { status: 500 }
    );
  }
}
