import { NextRequest, NextResponse } from "next/server"

const GNEWS_BASE = "https://gnews.io/api/v4"

// GNews native categories
const NATIVE_CATEGORIES = new Set([
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

// Categories not native to GNews -> use search endpoint
const SEARCH_CATEGORIES: Record<string, string> = {
  politics: "politics",
  crime: "crime OR police OR court",
}

// For the "all" feed on free plans (no pagination), rotate categories per page
const ALL_ROTATION = [
  "general",
  "world",
  "nation",
  "business",
  "technology",
  "sports",
  "entertainment",
  "science",
  "health",
]

export async function GET(req: NextRequest) {
  const apiKey = process.env.GNEWS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GNEWS_API_KEY" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || "general"
  const lang = searchParams.get("lang") === "hi" ? "hi" : "en"
  const q = searchParams.get("q")?.trim() || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))

  // Pin to India so English also shows Indian + world news (same as Hindi),
  // except the "world" category which stays global.
  const countryParam = category === "world" ? "" : "&country=in"

  let url: string

  if (q) {
    // Search mode - India region so results include Indian + world coverage
    url = `${GNEWS_BASE}/search?q=${encodeURIComponent(q)}&lang=${lang}&country=in&max=10&page=${page}&sortby=publishedAt&apikey=${apiKey}`
  } else if (category === "all") {
    // Rotate categories so infinite scroll keeps yielding fresh articles
    const rotated = ALL_ROTATION[(page - 1) % ALL_ROTATION.length]
    const innerPage = Math.floor((page - 1) / ALL_ROTATION.length) + 1
    const rotatedCountry = rotated === "world" ? "" : "&country=in"
    url = `${GNEWS_BASE}/top-headlines?category=${rotated}&lang=${lang}${rotatedCountry}&max=10&page=${innerPage}&apikey=${apiKey}`
  } else if (NATIVE_CATEGORIES.has(category)) {
    url = `${GNEWS_BASE}/top-headlines?category=${category}&lang=${lang}${countryParam}&max=10&page=${page}&apikey=${apiKey}`
  } else if (SEARCH_CATEGORIES[category]) {
    url = `${GNEWS_BASE}/search?q=${encodeURIComponent(SEARCH_CATEGORIES[category])}&lang=${lang}&country=in&max=10&page=${page}&sortby=publishedAt&apikey=${apiKey}`
  } else {
    url = `${GNEWS_BASE}/top-headlines?category=general&lang=${lang}${countryParam}&max=10&page=${page}&apikey=${apiKey}`
  }

  try {
    const res = await fetch(url, { next: { revalidate: 120 } })
    const data = await res.json()

    if (!res.ok) {
      // Free plan: pagination beyond page 1 may be rejected -> signal end of feed
      if (res.status === 403 || res.status === 400) {
        return NextResponse.json({ totalArticles: 0, articles: [], endOfFeed: true })
      }
      return NextResponse.json(
        { error: data?.errors?.[0] || "Failed to fetch news" },
        { status: res.status },
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Network error fetching news" }, { status: 502 })
  }
}
