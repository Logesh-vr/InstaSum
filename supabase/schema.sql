-- ================================================================
--  InstaSum — Supabase Database Schema
--  Run this entire file in the Supabase SQL Editor once.
--  Dashboard → SQL Editor → New query → paste → Run
-- ================================================================

-- ── 1. Categories table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Videos table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url        TEXT NOT NULL UNIQUE,          -- Prevents duplicate ingestion
  platform          TEXT NOT NULL,                  -- 'instagram' | 'youtube' | 'tiktok'
  video_title       TEXT,
  thumbnail_url     TEXT,
  raw_transcript    TEXT,
  summary           TEXT,
  key_takeaways     TEXT[],
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'done' | 'error'
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Indexes for fast queries ────────────────────────────────
CREATE INDEX IF NOT EXISTS videos_category_id_idx  ON videos(category_id);
CREATE INDEX IF NOT EXISTS videos_created_at_idx   ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS videos_platform_idx     ON videos(platform);
CREATE INDEX IF NOT EXISTS videos_source_url_idx   ON videos(source_url);

-- ── 4. Enable Row Level Security (RLS) ────────────────────────
--  We use the service_role key on the server, so these policies
--  are a safety net for direct client access via anon key.
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow anon read (for the client-side queries)
CREATE POLICY "Allow anon read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read videos" ON videos
  FOR SELECT USING (true);

-- Service role (server-side) can do everything — no policy needed
-- because service_role bypasses RLS by default.

-- ── 5. Helper view — videos with category name ────────────────
CREATE OR REPLACE VIEW videos_with_category AS
  SELECT
    v.*,
    c.name AS category_name
  FROM videos v
  LEFT JOIN categories c ON c.id = v.category_id
  ORDER BY v.created_at DESC;
