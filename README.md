## Live Demo = https://mynews-web.vercel.app/

## 📖 Overview

**The Chronicle** (repository: `News-Web`) is a news reading experience built on the Next.js App Router. A single
server route, `/api/news`, aggregates headlines from multiple upstream providers, normalises them into one article
shape, and serves them to a reading surface with infinite scroll, a trending carousel, and a breaking-news ticker.

Its defining trait is a **resilient multi-source data layer**: GNews API v4 is the primary provider, but because free
news APIs impose tight quotas the route falls back to Bing News RSS and Google News RSS, deduplicates the merged
result, paginates it server-side, and can still serve stale-but-valid content for up to 24 hours if every upstream
source fails. The whole interface — categories, UI strings, date formatting, and the upstream query strategy — is
available in English and Hindi.

## ✨ Key Features

**Content Discovery**
- 11 categories from `lib/i18n.ts`: All News, World, National, Politics, Crime, Business, Technology, Sports, Entertainment, Science, Health.
- Full-text search across every source; submitting a query replaces the category feed with search results.
- Auto-rotating trending carousel (up to 8 stories, 6-second autoplay) with arrows, progress segments, pause/play, touch swipe, and a desktop thumbnail rail, plus a `requestAnimationFrame` breaking-news ticker.

**Reading Experience**
- Infinite scroll via `swr/infinite` and an `IntersectionObserver` sentinel with a 600px root margin, so the next page loads before the reader reaches the end.
- Cross-page deduplication by article URL, with end-of-feed detection when an upstream page returns nothing new.
- Estimated read time at 200 words per minute, plus source badge, timestamp, and description clamp on every card.

**Internationalization**
- English and Hindi UI behind a single navbar toggle; every string, category label, and empty/error state is translated.
- Locale-aware timestamps via `Intl` (`en-US` / `hi-IN`) and dedicated Devanagari typography (`Noto Sans Devanagari`) wired into the Tailwind font stack.
- Language selection also changes the upstream request (`hl`/`ceid` for Google News RSS, `lang` for GNews).

**Performance**
- Three-tier caching: a process-level in-memory cache (10-minute fresh window, 24-hour stale window), Next.js fetch revalidation on every upstream call, and CDN hints via `s-maxage` / `stale-while-revalidate`.
- SWR tuned against redundant traffic (`revalidateOnFocus: false`, `keepPreviousData`, 60-second deduping, 5-minute background refresh for trending), lazy-loaded images that hide gracefully on failure, and `fetchPriority="high"` on the first carousel slide.

**UI/UX**
- Dark-only "luxury editorial" theme — near-black, ivory, gold primary, crimson for live/breaking — expressed as OKLCH design tokens in `app/globals.css`.
- Framer Motion throughout: scroll-linked progress bar, animated nav underline (`layoutId`), staggered card reveals, animated mobile menu, back-to-top button, and a custom shimmer skeleton grid.
- Accessibility: ARIA roles on the carousel and category nav, `aria-pressed` on the language toggle, `aria-live` on the loading sentinel, visible focus rings, and semantic `<time>` elements.

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16.2.6 (App Router, Route Handlers) |
| UI Library | React 19 / React DOM 19 |
| Language | TypeScript 5.7.3 (`strict: true`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`, `tw-animate-css` |
| Components | shadcn (`base-nova` style), `@base-ui/react`, `class-variance-authority`, `lucide-react` |
| Data Fetching | SWR 2.4 (`useSWR`, `useSWRInfinite`) |
| Animation | Framer Motion 12 |
| Fonts | Inter, Playfair Display, Noto Sans Devanagari (`next/font/google`) |
| News Sources | GNews API v4 (primary), Bing News RSS, Google News RSS |
| Tooling | `@vercel/analytics` (production only), `clsx` + `tailwind-merge` (`cn` helper) |
| Package Manager | pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) |

## 🌐 Supported Languages

Defined in `lib/i18n.ts` as `type Lang = "en" | "hi"`. Both languages ship complete translations for the brand, tagline, categories, search placeholder, loading / end-of-feed / empty / error states, footer, and newsletter.

| Language | Code | Display Locale | Upstream Locale |
| --- | --- | --- | --- |
| English | `en` | `en-US` | `hl=en-IN`, `ceid=IN:en` |
| Hindi (हिन्दी) | `hi` | `hi-IN` | `hl=hi-IN`, `ceid=IN:hi` |

## 🚀 Getting Started

### Prerequisites

- Node.js 20.9 or newer (required by Next.js 16)
- pnpm 9 or newer (`npm install -g pnpm`)
- A GNews API key — optional, see [Environment Variables](#-environment-variables)

### Installation & Setup

```bash
git clone https://github.com/theafzalhussain/News-Web.git
cd News-Web
pnpm install        # or: npm install
```

Create a `.env.local` file in the project root. If the key is omitted the application still runs —
`/api/news` falls back to the Bing and Google News RSS sources automatically.

```bash
GNEWS_API_KEY=your_gnews_api_key_here
```

Then start the app:

```bash
pnpm dev            # development server on http://localhost:3000
pnpm build          # optimised production build
pnpm start          # serve the production build
```

## 🔑 Environment Variables

| Variable | Description | Required |
| --- | --- | --- |
| `GNEWS_API_KEY` | API key for GNews API v4. Read in `app/api/news/route.ts` and used for the primary `top-headlines` and `search` requests (page 1 only). | No — the route degrades to RSS sources when unset |

> Get a free key from the [GNews dashboard](https://gnews.io/). It stays server-side: the route handler reads it from `process.env` and it carries no `NEXT_PUBLIC_` prefix, so it never reaches the browser.

## 📜 Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `pnpm dev` | `next dev` | Start the development server with hot reloading |
| `pnpm build` | `next build` | Create an optimised production build |
| `pnpm start` | `next start` | Serve the production build |
| `pnpm lint` | `eslint .` | Run ESLint across the project |

> `eslint` is declared as a script but is not currently listed in `devDependencies` — install it and add a config file before running `pnpm lint`.

## 📂 Project Structure

```
News-Web/
├── app/
│   ├── api/news/route.ts       # Multi-source news aggregator + in-memory cache (GET /api/news)
│   ├── globals.css             # Tailwind v4 entry, OKLCH design tokens, shimmer keyframes
│   ├── layout.tsx              # Metadata, OG/Twitter tags, fonts, Vercel Analytics
│   └── page.tsx                # Renders <NewsApp />
├── components/
│   ├── ui/button.tsx           # CVA button on the @base-ui/react primitive (not yet mounted)
│   ├── article-image.tsx       # Hotlink-safe <img> with branded fallback (not yet mounted)
│   ├── back-to-top.tsx         # Floating scroll-to-top button (appears past 400px)
│   ├── breaking-ticker.tsx     # rAF-driven marquee of the latest 10 headlines
│   ├── navbar.tsx              # Brand, search, LIVE badge, EN/हिं toggle, categories, mobile menu
│   ├── news-app.tsx            # Client root: owns lang/category/query state, fetches trending
│   ├── news-card.tsx           # Article card: image, source, date, read time, actions
│   ├── news-feed.tsx           # useSWRInfinite feed, dedupe, skeletons, scroll sentinel
│   ├── newsletter-cta.tsx      # Bilingual newsletter form (client-side confirmation only)
│   ├── premium-footer.tsx      # Brand, categories, quick links, and about columns
│   ├── scroll-progress.tsx     # Spring-animated reading-progress bar
│   ├── trending-carousel.tsx   # Autoplay hero carousel with progress rail and thumbnails
│   └── trending-hero.tsx       # Alternative editorial hero, 1 main + 3 side (not yet mounted)
├── lib/
│   ├── i18n.ts                 # Lang type, CATEGORIES, STRINGS (en/hi), Article type, formatDate
│   └── utils.ts                # cn() — clsx + tailwind-merge
├── public/                     # Favicons, apple icon, placeholder assets
├── components.json             # shadcn config (base-nova style, lucide icons)
├── next.config.mjs             # Unoptimized images, TypeScript build errors ignored
├── postcss.config.mjs          # @tailwindcss/postcss plugin
├── tsconfig.json               # Strict TypeScript, "@/*" path alias
└── pnpm-workspace.yaml         # pnpm allowBuilds settings
```

## 🔌 API Route

### `GET /api/news`

Aggregates, normalises, caches, and paginates headlines from up to three upstream sources.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `category` | string | `general` | One of `all`, `general`, `world`, `nation`, `politics`, `crime`, `business`, `technology`, `sports`, `entertainment`, `science`, `health`. Ignored when `q` is present. |
| `lang` | `en` \| `hi` | `en` | Any value other than `hi` resolves to `en`. |
| `q` | string | – | Free-text search query. When supplied it overrides `category`. |
| `page` | integer | `1` | 1-based page number; values below 1 are clamped to 1. Page size is 10. |

```http
GET /api/news?category=technology&lang=en&page=1
GET /api/news?q=cricket&lang=hi&page=2
```

Response — every article carries `title`, `description`, `content`, `url`, `image`, `publishedAt`, and `source`. `image` may be `null` (Google News RSS exposes no images) and `endOfFeed` tells the client to stop paging:

```json
{
  "totalArticles": 30,
  "endOfFeed": false,
  "articles": [
    {
      "title": "Example headline",
      "description": "Short summary of the story.",
      "url": "https://example.com/article",
      "image": "https://example.com/image.jpg",
      "publishedAt": "2026-08-31T09:15:00.000Z",
      "source": { "name": "Example News", "url": "https://example.com" }
    }
  ]
}
```

**Resolution order**

1. **Fresh in-memory cache** — returned immediately when the entry is younger than 10 minutes.
2. **GNews API v4** — only when `GNEWS_API_KEY` is set and `page === 1`; calls `top-headlines` or `search` scoped to `country=in` (dropped only for the `world` top-headlines feed), with `revalidate: 300`.
3. **RSS fallback** — Bing News RSS (English only, includes images) merged with Google News RSS (both languages), title-deduplicated, cached as one list, then paginated server-side in slices of 10 with `revalidate: 600`.
4. **Stale cache** — any entry younger than 24 hours is served if every upstream call fails.
5. **`502`** — `{ "error": "Could not load news from any source" }` when nothing is available.

**Caching behaviour** — responses from steps 1–3 carry `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (the stale fallback omits it). The server cache is keyed by query/category, language, and page, and evicts the 100 oldest keys once it exceeds 300 entries.

## 🖼️ Screenshots

| Home — Trending Carousel | Latest Stories Feed |
| --- | --- |
| <!-- Replace with your screenshot: docs/screenshots/home-trending.png --> | <!-- Replace with your screenshot: docs/screenshots/latest-feed.png --> |
| **Hindi Interface** | **Search Results** |
| <!-- Replace with your screenshot: docs/screenshots/hindi-ui.png --> | <!-- Replace with your screenshot: docs/screenshots/search-results.png --> |

Save the images under `docs/screenshots/` and replace the comments above with Markdown image links.

## 🗺️ Roadmap

- [ ] Persist bookmarked articles (the card action is currently presentational)
- [ ] Wire the newsletter form to a real subscription backend
- [ ] Add a light theme alongside the current dark-only token set
- [ ] Route categories and languages through URL segments for shareable, SEO-friendly links
- [ ] Add ESLint configuration, CI, and a shared cache store for multi-instance deployments

## 🤝 Contributing

1. Fork the repository and create a branch: `git checkout -b feature/your-feature`
2. Install dependencies with `pnpm install` and verify `pnpm build` succeeds
3. Keep new UI strings bilingual — add them to both the `en` and `hi` blocks in `lib/i18n.ts`
4. Commit (`git commit -m "feat: describe your change"`), push, and open a pull request

## 📄 License

No license file is currently present in this repository. Adding an [MIT License](https://choosealicense.com/licenses/mit/) as `LICENSE` is recommended so that reuse terms are explicit.

## 👤 Author

**Afzal Hussain** — GitHub: [@theafzalhussain](https://github.com/theafzalhussain) · Repository: [theafzalhussain/News-Web](https://github.com/theafzalhussain/News-Web)

---

<p align="center">News data provided by <a href="https://gnews.io/">GNews</a>, Google News RSS, and Bing News RSS.</p>
