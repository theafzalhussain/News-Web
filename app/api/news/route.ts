import { NextRequest, NextResponse } from "next/server"

const GNEWS_BASE = "https://gnews.io/api/v4"
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
const PAGE_SIZE = 10

interface Article {
  title: string
  description: string
  content: string
  url: string
  image: string | null
  publishedAt: string
  source: { name: string; url: string }
}

interface FeedResult {
  totalArticles: number
  articles: Article[]
  endOfFeed?: boolean
}

// ---------------------------------------------------------------------------
// In-memory cache (fresh 10 min, stale kept 24h to survive API rate limits)
// ---------------------------------------------------------------------------
const FRESH_TTL = 10 * 60 * 1000
const STALE_TTL = 24 * 60 * 60 * 1000

interface CacheEntry {
  ts: number
  data: FeedResult
}

const globalCache = globalThis as unknown as { __newsCache?: Map<string, CacheEntry> }
const cache = (globalCache.__newsCache ??= new Map<string, CacheEntry>())

function getCache(key: string, maxAge: number): FeedResult | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < maxAge) return entry.data
  return null
}

function setCache(key: string, data: FeedResult) {
  cache.set(key, { ts: Date.now(), data })
  // Basic eviction to avoid unbounded growth
  if (cache.size > 300) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts).slice(0, 100)
    for (const [k] of oldest) cache.delete(k)
  }
}

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------
const GNEWS_NATIVE = new Set([
  "general",
  "world",
  "nation",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
])

const GNEWS_SEARCH: Record<string, string> = {
  politics: "india politics",
  crime: "india crime OR police OR court",
}

// Google News RSS topic ids
const GOOGLE_TOPICS: Record<string, string> = {
  general: "", // top stories feed
  all: "",
  world: "WORLD",
  nation: "NATION",
  business: "BUSINESS",
  technology: "TECHNOLOGY",
  entertainment: "ENTERTAINMENT",
  sports: "SPORTS",
  science: "SCIENCE",
  health: "HEALTH",
}

// Search queries per category for RSS search feeds
const CATEGORY_QUERIES: Record<string, { en: string; hi: string }> = {
  politics: { en: "india politics", hi: "भारत राजनीति" },
  crime: { en: "india crime police", hi: "अपराध पुलिस समाचार" },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

function stripHtml(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))
  return m ? m[1] : ""
}

function paginate(articles: Article[], page: number): FeedResult {
  const start = (page - 1) * PAGE_SIZE
  const slice = articles.slice(start, start + PAGE_SIZE)
  return {
    totalArticles: articles.length,
    articles: slice,
    endOfFeed: start + PAGE_SIZE >= articles.length,
  }
}

// ---------------------------------------------------------------------------
// Source 1: GNews (primary — has images, limited free quota)
// ---------------------------------------------------------------------------
async function fetchGNews(
  category: string,
  lang: string,
  q: string,
  page: number,
  apiKey: string,
): Promise<FeedResult | null> {
  const countryParam = category === "world" ? "" : "&country=in"
  let url: string

  if (q) {
    url = `${GNEWS_BASE}/search?q=${encodeURIComponent(q)}&lang=${lang}&country=in&max=10&page=${page}&sortby=publishedAt&apikey=${apiKey}`
  } else if (category === "all" || category === "general") {
    url = `${GNEWS_BASE}/top-headlines?category=general&lang=${lang}${countryParam}&max=10&page=${page}&apikey=${apiKey}`
  } else if (GNEWS_NATIVE.has(category)) {
    url = `${GNEWS_BASE}/top-headlines?category=${category}&lang=${lang}${countryParam}&max=10&page=${page}&apikey=${apiKey}`
  } else if (GNEWS_SEARCH[category]) {
    url = `${GNEWS_BASE}/search?q=${encodeURIComponent(GNEWS_SEARCH[category])}&lang=${lang}&country=in&max=10&page=${page}&sortby=publishedAt&apikey=${apiKey}`
  } else {
    return null
  }

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data?.articles) || data.articles.length === 0) return null
    return {
      totalArticles: data.totalArticles ?? data.articles.length,
      articles: data.articles,
      endOfFeed: data.articles.length < PAGE_SIZE,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Source 2: Bing News RSS (English fallback — includes images, unlimited)
// ---------------------------------------------------------------------------
function parseBing(xml: string): Article[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  const out: Article[] = []
  for (const item of items) {
    const rawTitle = decodeEntities(tag(item, "title"))
    let link = decodeEntities(tag(item, "link"))
    // Bing wraps links in a redirect; extract the real URL
    const urlMatch = link.match(/[?&]url=([^&]+)/)
    if (urlMatch) {
      try {
        link = decodeURIComponent(urlMatch[1])
      } catch {}
    }
    const desc = stripHtml(tag(item, "description"))
    const pub = tag(item, "pubDate")
    const source = decodeEntities(tag(item, "News:Source")) || "Bing News"
    let image: string | null = decodeEntities(tag(item, "News:Image")) || null
    if (image) image = `${image}&w=800&h=450&c=14`
    if (!rawTitle || !link) continue
    out.push({
      title: rawTitle,
      description: desc,
      content: desc,
      url: link,
      image,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      source: { name: source, url: link },
    })
  }
  return out
}

async function fetchBing(query: string): Promise<Article[]> {
  try {
    const res = await fetch(
      `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&count=30`,
      { headers: { "User-Agent": UA }, next: { revalidate: 600 } },
    )
    if (!res.ok) return []
    return parseBing(await res.text())
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Source 3: Google News RSS (works for Hindi + English, unlimited, no images)
// ---------------------------------------------------------------------------
function parseGoogle(xml: string): Article[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  const out: Article[] = []
  for (const item of items) {
    let title = decodeEntities(tag(item, "title"))
    const link = decodeEntities(tag(item, "link"))
    const pub = tag(item, "pubDate")
    const sourceMatch = item.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/i)
    const sourceName = sourceMatch ? decodeEntities(sourceMatch[2]) : "Google News"
    const sourceUrl = sourceMatch ? decodeEntities(sourceMatch[1]) : link
    // Titles end with " - Source Name"; strip it
    if (sourceName && title.endsWith(` - ${sourceName}`)) {
      title = title.slice(0, -(sourceName.length + 3))
    }
    const desc = stripHtml(tag(item, "description"))
    if (!title || !link) continue
    out.push({
      title,
      description: desc && desc !== title ? desc : "",
      content: desc,
      url: link,
      image: null,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      source: { name: sourceName, url: sourceUrl },
    })
  }
  return out
}

async function fetchGoogle(category: string, lang: string, q: string): Promise<Article[]> {
  const hl = lang === "hi" ? "hi-IN" : "en-IN"
  const ceid = lang === "hi" ? "IN:hi" : "IN:en"
  let url: string

  if (q) {
    url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=IN&ceid=${ceid}`
  } else if (CATEGORY_QUERIES[category]) {
    const query = CATEGORY_QUERIES[category][lang === "hi" ? "hi" : "en"]
    url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=IN&ceid=${ceid}`
  } else if (GOOGLE_TOPICS[category]) {
    url = `https://news.google.com/rss/headlines/section/topic/${GOOGLE_TOPICS[category]}?hl=${hl}&gl=IN&ceid=${ceid}`
  } else {
    // Top stories
    url = `https://news.google.com/rss?hl=${hl}&gl=IN&ceid=${ceid}`
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    return parseGoogle(await res.text())
  } catch {
    return []
  }
}

// Bing query per category (English fallback with images)
function bingQuery(category: string, q: string): string {
  if (q) return q
  const map: Record<string, string> = {
    all: "india top news",
    general: "india top news",
    world: "world news",
    nation: "india national news",
    politics: "india politics",
    crime: "india crime police",
    business: "india business economy",
    technology: "technology news",
    sports: "india sports cricket",
    entertainment: "bollywood entertainment",
    science: "science news",
    health: "health news india",
  }
  return map[category] ?? `${category} news india`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || "general"
  const lang = searchParams.get("lang") === "hi" ? "hi" : "en"
  const q = searchParams.get("q")?.trim() || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))

  const cacheKey = `${q ? `q:${q}` : `c:${category}`}|${lang}|${page}`
  const rssKey = `rss|${q ? `q:${q}` : `c:${category}`}|${lang}`

  // 1. Fresh cache hit
  const fresh = getCache(cacheKey, FRESH_TTL)
  if (fresh) {
    return NextResponse.json(fresh, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  }

  // 2. GNews primary (only page 1 on most free plans; deeper pages go to RSS)
  const apiKey = process.env.GNEWS_API_KEY
  if (apiKey && page === 1) {
    const gnews = await fetchGNews(category, lang, q, page, apiKey)
    if (gnews) {
      // Don't mark end-of-feed: RSS continues pagination beyond GNews page 1
      const result = { ...gnews, endOfFeed: false }
      setCache(cacheKey, result)
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      })
    }
  }

  // 3. RSS fallback — fetch full list once, cache it, paginate server-side
  let rssArticles = getCache(rssKey, FRESH_TTL)?.articles ?? null

  if (!rssArticles) {
    const collected: Article[] = []

    // English: Bing first (has images)
    if (lang === "en") {
      collected.push(...(await fetchBing(bingQuery(category, q))))
    }

    // Google News RSS (both langs; merged after Bing)
    const google = await fetchGoogle(category, lang, q)
    const seen = new Set(collected.map((a) => a.title.toLowerCase().slice(0, 60)))
    for (const a of google) {
      const k = a.title.toLowerCase().slice(0, 60)
      if (!seen.has(k)) {
        seen.add(k)
        collected.push(a)
      }
    }

    if (collected.length > 0) {
      rssArticles = collected
      setCache(rssKey, { totalArticles: collected.length, articles: collected })
    }
  }

  if (rssArticles && rssArticles.length > 0) {
    // When GNews served page 1, offset RSS pagination so content continues
    const result = paginate(rssArticles, page)
    setCache(cacheKey, result)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  }

  // 4. Serve stale cache if everything failed
  const stale = getCache(cacheKey, STALE_TTL) ?? getCache(rssKey, STALE_TTL)
  if (stale) {
    return NextResponse.json(stale)
  }

  return NextResponse.json(
    { error: "Could not load news from any source" },
    { status: 502 },
  )
}
