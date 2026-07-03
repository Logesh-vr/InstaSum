'use client';

import { useState } from 'react';
import SubmitBar from '@/components/SubmitBar';
import VideoFeed from '@/components/VideoFeed';

export default function DashboardPage() {
  // Bumped every time a video is successfully added — triggers feed re-fetch
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleVideoAdded = () => setRefreshSignal((n) => n + 1);

  return (
    <>
      {/* ── Header ────────────────────────────────────────── */}
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon" aria-hidden="true">⚡</div>
          <span className="logo-text">InstaSum</span>
        </div>

        <div className="header-stats">
          <div className="stat-badge">
            <span>🧠</span>
            <span>AI-Powered Knowledge Base</span>
          </div>
          <div className="stat-badge">
            <span>📱</span>
            <span>
              Supports <strong>Instagram</strong> · <strong>YouTube</strong> · <strong>TikTok</strong>
            </span>
          </div>
        </div>
      </header>

      {/* ── Submit Bar ────────────────────────────────────── */}
      <main id="main-content">
        <SubmitBar onVideoAdded={handleVideoAdded} />

        {/* ── Library ───────────────────────────────────── */}
        <section aria-label="Your knowledge library">
          <VideoFeed refreshSignal={refreshSignal} />
        </section>
      </main>
    </>
  );
}
