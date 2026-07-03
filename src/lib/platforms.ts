// ─────────────────────────────────────────────────────────────
//  Platform detector
//  Identifies which short-form video platform a URL belongs to
// ─────────────────────────────────────────────────────────────

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'unknown';

const PLATFORM_PATTERNS: Record<Platform, RegExp> = {
  instagram: /instagram\.com\/(reel|p|tv)\//i,
  youtube: /(?:youtube\.com\/shorts\/|youtu\.be\/)/i,
  tiktok: /tiktok\.com\/@[^/]+\/video\//i,
  unknown: /.*/,
};

export function detectPlatform(url: string): Platform {
  if (PLATFORM_PATTERNS.instagram.test(url)) return 'instagram';
  if (PLATFORM_PATTERNS.youtube.test(url)) return 'youtube';
  if (PLATFORM_PATTERNS.tiktok.test(url)) return 'tiktok';
  return 'unknown';
}

export function isValidVideoUrl(url: string): boolean {
  try {
    new URL(url);
    const platform = detectPlatform(url);
    return platform !== 'unknown';
  } catch {
    return false;
  }
}

export const PLATFORM_META: Record<
  Exclude<Platform, 'unknown'>,
  { label: string; color: string; emoji: string }
> = {
  instagram: { label: 'Instagram', color: '#E1306C', emoji: '📸' },
  youtube:   { label: 'YouTube',   color: '#FF0000', emoji: '▶️' },
  tiktok:    { label: 'TikTok',    color: '#010101', emoji: '🎵' },
};
