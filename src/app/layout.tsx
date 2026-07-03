import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InstaSum — Video Knowledge Capture',
  description:
    'Capture, summarize, and permanently store insights from Instagram Reels, YouTube Shorts, and TikTok videos. Your personal AI-powered knowledge base.',
  keywords: [
    'video summary',
    'knowledge base',
    'Instagram Reels',
    'YouTube Shorts',
    'TikTok',
    'AI transcript',
    'learning',
  ],
  openGraph: {
    title: 'InstaSum — Video Knowledge Capture',
    description: 'Turn short-form videos into permanent, searchable knowledge.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-wrapper">{children}</div>
      </body>
    </html>
  );
}
