'use client';

import { useState, useCallback } from 'react';
import { detectPlatform, PLATFORM_META, Platform } from '@/lib/platforms';

type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: Step[] = [
  { id: 'fetch',    label: '① Fetching transcript via Apify…',       status: 'pending' },
  { id: 'analyze',  label: '② AI is analyzing & categorizing…',       status: 'pending' },
  { id: 'save',     label: '③ Saving to your knowledge base…',        status: 'pending' },
];

interface SubmitBarProps {
  onVideoAdded: () => void; // Callback to refresh the video feed
}

export default function SubmitBar({ onVideoAdded }: SubmitBarProps) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'duplicate';
    message: string;
  } | null>(null);

  const detectedPlatform: Platform = detectPlatform(url);
  const platformMeta =
    detectedPlatform !== 'unknown'
      ? PLATFORM_META[detectedPlatform as Exclude<Platform, 'unknown'>]
      : null;

  const setStepStatus = useCallback(
    (stepId: string, status: StepStatus) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, status } : s))
      );
    },
    []
  );

  const handleSubmit = async () => {
    if (!url.trim() || isProcessing) return;

    // Reset state
    setIsProcessing(true);
    setResult(null);
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' })));

    try {
      // ── Step 1: Apify fetch ──────────────────────────────
      setStepStatus('fetch', 'active');

      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Duplicate
        setStepStatus('fetch', 'done');
        setStepStatus('analyze', 'done');
        setStepStatus('save', 'done');
        setResult({ type: 'duplicate', message: data.message || 'Already in your library!' });
        setIsProcessing(false);
        return;
      }

      if (!res.ok) {
        // Determine which step failed from the error message
        const errMsg: string = data.error || 'An unexpected error occurred.';

        if (errMsg.toLowerCase().includes('transcript')) {
          setStepStatus('fetch', 'error');
        } else if (errMsg.toLowerCase().includes('ai') || errMsg.toLowerCase().includes('openai')) {
          setStepStatus('fetch', 'done');
          setStepStatus('analyze', 'error');
        } else {
          setStepStatus('fetch', 'done');
          setStepStatus('analyze', 'done');
          setStepStatus('save', 'error');
        }

        setResult({ type: 'error', message: errMsg });
        setIsProcessing(false);
        return;
      }

      // Success — animate remaining steps quickly
      setStepStatus('fetch', 'done');
      await delay(300);
      setStepStatus('analyze', 'active');
      await delay(400);
      setStepStatus('analyze', 'done');
      await delay(300);
      setStepStatus('save', 'active');
      await delay(300);
      setStepStatus('save', 'done');

      const title = data.video?.video_title;
      setResult({
        type: 'success',
        message: `✓ ${title ? `"${title}"` : 'Video'} captured & saved successfully!`,
      });

      // Clear input and refresh feed
      setUrl('');
      onVideoAdded();
    } catch {
      setStepStatus('fetch', 'error');
      setResult({ type: 'error', message: 'Network error. Check your connection and try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const showProcessing = isProcessing || result !== null;

  return (
    <section className="submit-section">
      <p className="submit-label">Paste a video link to capture insights</p>

      <div className="submit-wrapper">
        <div className={`platform-badge ${platformMeta ? detectedPlatform : ''}`}>
          {platformMeta ? (
            <>
              <span>{platformMeta.emoji}</span>
              <span>{platformMeta.label}</span>
            </>
          ) : (
            <>
              <span>🔗</span>
              <span>Video URL</span>
            </>
          )}
        </div>

        <input
          id="video-url-input"
          type="url"
          className="submit-input"
          placeholder="https://www.instagram.com/reel/...  or  youtube.com/shorts/..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setResult(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          autoComplete="off"
          spellCheck={false}
        />

        <button
          id="submit-video-btn"
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isProcessing || !url.trim()}
        >
          {isProcessing ? 'Processing…' : '⚡ Capture'}
        </button>
      </div>

      {showProcessing && (
        <div className="processing-card">
          <p className="processing-title">Pipeline Status</p>
          <div className="steps">
            {steps.map((step) => (
              <div key={step.id} className="step">
                <span className={`step-icon ${step.status}`}>
                  {step.status === 'done'  && '✓'}
                  {step.status === 'error' && '✕'}
                  {step.status === 'active' && '◉'}
                  {step.status === 'pending' && '○'}
                </span>
                <span className={`step-text ${step.status}`}>{step.label}</span>
              </div>
            ))}
          </div>

          {result && (
            <div className={`process-result ${result.type}`}>
              {result.message}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
