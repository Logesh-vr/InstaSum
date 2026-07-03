'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface VideoCardProps {
  video: {
    id: string;
    source_url: string;
    platform: string;
    video_title?: string;
    thumbnail_url?: string;
    summary: string;
    key_takeaways: string[];
    created_at: string;
    categories?: { id: string; name: string } | null;
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPlatformLabel(platform: string): string {
  const map: Record<string, string> = {
    instagram: 'Instagram',
    youtube:   'YouTube Shorts',
    tiktok:    'TikTok',
  };
  return map[platform] || platform;
}

export default function VideoCard({ video }: VideoCardProps) {
  const [expanded, setExpanded] = useState(false);

  const platform = video.platform?.toLowerCase() || 'unknown';
  const title = video.video_title || 'Untitled Video';
  const categoryName = video.categories?.name;
  const takeaways = Array.isArray(video.key_takeaways) ? video.key_takeaways : [];
  const visibleTakeaways = expanded ? takeaways : takeaways.slice(0, 3);

  return (
    <article className="video-card">
      {/* Thumbnail */}
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail_url}
          alt={title}
          className="card-thumbnail"
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.className = `card-thumb-placeholder thumb-${platform}`;
            placeholder.textContent = platform === 'instagram' ? '📸' : platform === 'youtube' ? '▶️' : '🎵';
            el.parentNode?.insertBefore(placeholder, el);
          }}
        />
      ) : (
        <div className={`card-thumb-placeholder thumb-${platform}`}>
          {platform === 'instagram' ? '📸' : platform === 'youtube' ? '▶️' : '🎵'}
        </div>
      )}

      <div className="card-body">
        {/* Meta row */}
        <div className="card-meta">
          {categoryName && (
            <span className="card-category">{categoryName}</span>
          )}
          <div className="card-platform-badge">
            <span className={`card-platform-dot ${platform}`} />
            {getPlatformLabel(platform)}
          </div>
        </div>

        {/* Title */}
        <h2 className="card-title">{title}</h2>

        {/* Summary */}
        <p className="card-summary" style={expanded ? { WebkitLineClamp: 'unset', overflow: 'visible' } : {}}>
          {video.summary}
        </p>

        {/* Key Takeaways */}
        {takeaways.length > 0 && (
          <div className="card-takeaways">
            <p className="takeaways-label">Key Takeaways</p>
            <ul className="takeaway-list">
              {visibleTakeaways.map((point, i) => (
                <li key={i} className="takeaway-item">
                  <span className="takeaway-bullet">◆</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {takeaways.length > 3 && (
              <button
                className="card-expand-btn"
                onClick={() => setExpanded(!expanded)}
                style={{ marginTop: '8px' }}
              >
                {expanded
                  ? '↑ Show less'
                  : `↓ ${takeaways.length - 3} more takeaway${takeaways.length - 3 > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="card-footer">
          <span className="card-date">{formatDate(video.created_at)}</span>
          <a
            href={video.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
          >
            Watch ↗
          </a>
        </div>
      </div>
    </article>
  );
}
