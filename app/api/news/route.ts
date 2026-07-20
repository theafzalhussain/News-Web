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
const UPSTREAM_TIMEOUT_MS = 4500

interface CacheEntry {
  ts: number
  data: FeedResult
}

const globalCache = globalThis as unknown as {
  __newsCache?: Map<string, CacheEntry>
  __newsInflight?: Map<string, Promise<FeedResult | null>>
}
const cache = (globalCache.__newsCache ??= new Map<string, CacheEntry>())
const inflight = (globalCache.__newsInflight ??= new Map<string, Promise<FeedResult | null>>())

function getCache(key: string, maxAge: number): FeedResult | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < maxAge) return entry.data
  return null
}

function upstreamSignal() {
  return AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
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
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

function stripHtml(s: string): string {
  return decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
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
    const res = await fetch(url, { signal: upstreamSignal(), next: { revalidate: 300 } })
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
    if (image) {
      // Bing serves image URLs over insecure http:// which fails and is blocked
      // as mixed content on https sites. Force https and request a sized thumb.
      image = image.replace(/^http:\/\//i, "https://")
      if (!/^https:\/\//i.test(image)) image = `https://www.bing.com${image.startsWith("/") ? "" : "/"}${image}`
      image = `${image}&w=800&h=450&c=14`
    }
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

async function fetchBing(query: string, lang: string = "en"): Promise<Article[]> {
  const mkt = lang === "hi" ? "hi-IN" : "en-IN"
  try {
    const res = await fetch(
      `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&count=50&setmkt=${mkt}&setlang=${lang}`,
      { headers: { "User-Agent": UA }, signal: upstreamSignal(), next: { revalidate: 600 } },
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
      signal: upstreamSignal(),
      next: { revalidate: 600 },
    })
    if (!res.ok) return []
    return parseGoogle(await res.text())
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// OG-image enrichment: pull og:image / twitter:image from the publisher page
// for articles that arrived without an image. Bounded + cached so it stays fast.
// ---------------------------------------------------------------------------
const ogCache = ((globalThis as unknown as { __ogCache?: Map<string, string | null> }).__ogCache ??=
  new Map<string, string | null>())

function extractOgImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      let url = decodeEntities(m[1]).trim()
      if (url.startsWith("//")) url = `https:${url}`
      if (url.startsWith("http://")) url = url.replace(/^http:\/\//i, "https://")
      if (/^https:\/\//i.test(url)) return url
    }
  }
  return null
}

async function fetchOgImage(pageUrl: string): Promise<string | null> {
  // Google News redirect links don't expose og:image — skip them.
  if (!/^https?:\/\//i.test(pageUrl) || /news\.google\.com/i.test(pageUrl)) return null
  if (ogCache.has(pageUrl)) return ogCache.get(pageUrl) ?? null
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      ogCache.set(pageUrl, null)
      return null
    }
    // Only need the <head>; read a bounded chunk to stay fast.
    const html = (await res.text()).slice(0, 60000)
    const img = extractOgImage(html)
    ogCache.set(pageUrl, img)
    return img
  } catch {
    ogCache.set(pageUrl, null)
    return null
  }
}

async function enrichImages(articles: Article[]): Promise<Article[]> {
  const missing = articles.filter((a) => !a.image)
  if (missing.length === 0) return articles
  await Promise.all(
    missing.map(async (article) => {
      const img = await fetchOgImage(article.url)
      if (img) article.image = img
    }),
  )
  return articles
}

// Bing query per category (fallback with images, both languages)
function bingQuery(category: string, q: string, lang: string = "en"): string {
  if (q) return q
  if (lang === "hi") {
    const hi: Record<string, string> = {
      all: "भारत ताजा समाचार",
      general: "भारत ताजा समाचार",
      world: "विश्व समाचार",
      nation: "भारत राष्ट्रीय समाचार",
      politics: "भारत राजनीति समाचार",
      crime: "अपराध पुलिस समाचार",
      business: "भारत व्यापार अर्थव्यवस्था",
      technology: "तकनीक समाचार",
      sports: "भारत खेल क्रिकेट",
      entertainment: "बॉलीवुड मनोरंजन",
      science: "विज्ञान समाचार",
      health: "स्वास्थ्य समाचार",
    }
    return hi[category] ?? `${category} समाचार`
  }
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

  const loadFeed = async (): Promise<FeedResult | null> => {
    let rssArticles = getCache(rssKey, FRESH_TTL)?.articles ?? null

    const rssPromise = rssArticles
      ? Promise.resolve(rssArticles)
      : (async () => {
          // Bing (has images) for both languages + Google (broad coverage)
          const [bing, google] = await Promise.all([
            fetchBing(bingQuery(category, q, lang), lang),
            fetchGoogle(category, lang, q),
          ])
          const collected: Article[] = []
          const seen = new Set<string>()
          for (const article of [...bing, ...google]) {
            const key = article.title.toLowerCase().replace(/\s+/g, " ").slice(0, 80)
            if (!article.url || seen.has(key)) continue
            seen.add(key)
            collected.push(article)
          }
          // Surface articles that have images first for a richer feed
          collected.sort((a, b) => (a.image ? 0 : 1) - (b.image ? 0 : 1))
          if (collected.length) {
            setCache(rssKey, { totalArticles: collected.length, articles: collected })
          }
          return collected
        })()

    const apiKey = process.env.GNEWS_API_KEY
    const gnewsPromise = apiKey && page === 1
      ? fetchGNews(category, lang, q, page, apiKey)
      : Promise.resolve(null)

    const [gnews, rss] = await Promise.all([gnewsPromise, rssPromise])
    rssArticles = rss

    if (page === 1 && gnews?.articles.length) {
      const seen = new Set(gnews.articles.map((article) => article.url))
      const merged = [...gnews.articles]
      for (const article of rssArticles) {
        if (!seen.has(article.url) && merged.length < PAGE_SIZE) merged.push(article)
      }
      await enrichImages(merged)
      return { totalArticles: Math.max(gnews.totalArticles, rssArticles.length), articles: merged, endOfFeed: false }
    }

    if (!rssArticles.length) return null
    const result = paginate(rssArticles, page)
    await enrichImages(result.articles)
    return result
  }

  let pending = inflight.get(cacheKey)
  if (!pending) {
    pending = loadFeed().finally(() => inflight.delete(cacheKey))
    inflight.set(cacheKey, pending)
  }
  const result = await pending

  if (result) {
    setCache(cacheKey, result)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    })
  }

  const stale = getCache(cacheKey, STALE_TTL) ?? getCache(rssKey, STALE_TTL)
  if (stale) {
    return NextResponse.json(stale, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400" },
    })
  }

  return NextResponse.json({ error: "Could not load news from any source" }, { status: 502 })
}
