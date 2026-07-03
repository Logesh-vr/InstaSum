# InstaSum ⚡
**Video Knowledge Capture & Storage Web Application**

InstaSum is a full-stack web application designed to automatically extract valuable insights from short-form videos (Instagram Reels, YouTube Shorts, and TikToks) and save them permanently to a searchable, categorized knowledge base.

---

## 🚀 Key Features

- **🌐 Social Video Ingestion:** Paste any public link from Instagram Reels, YouTube Shorts, or TikTok.
- **🔄 Automated Transcribing:** Powered by [Apify's Social Video Transcriber API](https://apify.com/) using AI models (Whisper) to pull transcripts directly from videos without downloading files locally.
- **🧠 AI Summarization & Insights:** Uses OpenAI's `gpt-4o-mini` to extract structured key takeaways, summarize the core lessons, and remove social media fluff.
- **🌱 Infinite Dynamic Categorization:** No pre-defined categories. The system reads existing categories in the database and contextually reuses an exact match or dynamically mints a new one (e.g. `"UI Design"`, `"Productivity"`, `"LinkedIn"`).
- **🔒 Duplicate Protection:** Database-level uniqueness constraints prevent redundant processing of already-saved URLs.
- **📱 Responsive Glassmorphic UI:** A dark-mode workspace built with custom CSS, interactive states, real-time debounced search, category filtering, and status progression indicators.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (hosted PostgreSQL)
- **AI Engine:** OpenAI (`gpt-4o-mini`)
- **Scraper/Transcriber:** Apify REST API
- **Styling:** Vanilla CSS (Glassmorphism & animations)

---

## 📦 Getting Started

### 1. Prerequisites & API Keys
Make sure you have accounts and copy the API credentials for:
1. **[Supabase](https://supabase.com/):** Create a project and grab your Project URL, Anon Key, and Service Role Key.
2. **[Apify](https://apify.com/):** Copy your Personal API token from Integrations.
3. **[OpenAI](https://platform.openai.com/):** Create an API key.

### 2. Database Schema Setup
Go to your Supabase project's **SQL Editor**, create a new query, paste the contents of `supabase/schema.sql`, and click **Run**. This creates:
- `categories` table
- `videos` table
- Indexing for optimized searches
- RLS Policies to allow anonymous reads
- A database view joining videos with categories

### 3. Environment Configuration
Create a `.env.local` file in the root of the project using the template in `.env.local.example`:

```env
APIFY_API_TOKEN=your_apify_api_token
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Running Locally
Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Project Structure

```
InstasUM/
├── src/
│   ├── app/
│   │   ├── globals.css           ← Full design system & layout styles
│   │   ├── layout.tsx            ← Root layout with SEO metadata
│   │   ├── page.tsx              ← Dashboard main layout
│   │   └── api/
│   │       ├── process/route.ts  ← Core processing pipeline (POST)
│   │       ├── videos/route.ts   ← Video library fetch & search (GET)
│   │       └── categories/route.ts ← Categories list & stats (GET)
│   ├── components/
│   │   ├── SubmitBar.tsx         ← Live URL platform detector + status bar
│   │   ├── VideoCard.tsx         ← Expandable card with thumbnails & summary
│   │   ├── VideoFeed.tsx         ← Grid rendering & pagination wrapper
│   │   ├── CategoryFilter.tsx    ← Dynamic scrollable filter pills
│   │   ├── SearchBar.tsx         ← Debounced query input
│   │   └── EmptyState.tsx        ← Search / library empty states
│   └── lib/
│       ├── apify.ts              ← Apify transcriber client
│       ├── openai.ts             ← OpenAI analysis layer
│       ├── platforms.ts          ← URL parsing helper
│       └── supabase/
│           ├── client.ts         ← Browser anon database client
│           └── server.ts         ← Admin server client
├── supabase/
│   └── schema.sql               ← Database setup script
├── .env.local.example           ← Environment template
└── package.json
```

---

## 🛡️ License

MIT License. Feel free to use and customize!
