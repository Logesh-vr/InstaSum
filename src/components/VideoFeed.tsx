'use client';

import { useState, useEffect, useCallback } from 'react';
import VideoCard from './VideoCard';
import CategoryFilter from './CategoryFilter';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Video {
  id: string;
  source_url: string;
  platform: string;
  video_title?: string;
  thumbnail_url?: string;
  summary: string;
  key_takeaways: string[];
  created_at: string;
  categories?: { id: string; name: string } | null;
}

interface VideoFeedProps {
  refreshSignal: number; // bumped by parent to trigger re-fetch
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumb" />
      <div className="skeleton-body">
        <div className="skeleton-line short" />
        <div className="skeleton-line full" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line full" />
        <div className="skeleton-line medium" />
      </div>
    </div>
  );
}

export default function VideoFeed({ refreshSignal }: VideoFeedProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (searchQuery)    params.set('search', searchQuery);

      const [videosRes, catsRes] = await Promise.all([
        fetch(`/api/videos?${params.toString()}`),
        fetch('/api/categories'),
      ]);

      const videosData = await videosRes.json();
      const catsData   = await catsRes.json();

      setVideos(videosData.videos || []);
      setTotalCount(videosData.total || 0);
      setCategories(catsData.categories || []);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, refreshSignal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allVideoCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      {/* Controls */}
      <div className="controls-row">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {categories.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            totalCount={allVideoCount}
          />
        </div>
      )}

      {/* Grid */}
      <div className="video-grid">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : videos.length === 0 ? (
          <EmptyState
            isFiltered={!!activeCategory}
            searchQuery={searchQuery}
          />
        ) : (
          videos.map((video) => <VideoCard key={video.id} video={video} />)
        )}
      </div>
    </>
  );
}
