"use client"

import { useCallback, useState } from "react"
import useSWR, { preload } from "swr"
import { Navbar } from "@/components/navbar"
import { TrendingCarousel } from "@/components/trending-carousel"
import { NewsFeed } from "@/components/news-feed"
import { STRINGS, type Article, type Lang } from "@/lib/i18n"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`News request failed: ${response.status}`)
  return response.json()
}

export function NewsApp() {
  const [lang, setLang] = useState<Lang>("en")
  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")
  const t = STRINGS[lang]

  // Trending: freshest top headlines for the selected language
  const { data: trendingData } = useSWR<{ articles: Article[] }>(
    `/api/news?category=general&lang=${lang}&page=1`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000,
      keepPreviousData: true,
      dedupingInterval: 60 * 1000,
    },
  )

  const prefetchCategory = useCallback(
    (cat: string) => {
      preload(`/api/news?lang=${lang}&page=1&category=${cat}`, fetcher)
    },
    [lang],
  )

  const handleCategoryChange = useCallback((cat: string) => {
    prefetchCategory(cat)
    setCategory(cat)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }, [prefetchCategory])

  const showTrending = !query

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        lang={lang}
        category={category}
        query={query}
        onCategoryChange={handleCategoryChange}
        onCategoryPrefetch={prefetchCategory}
        onLangChange={setLang}
        onSearch={setQuery}
      />

      <main>
        {showTrending && <TrendingCarousel articles={trendingData?.articles ?? []} lang={lang} />}
        <NewsFeed lang={lang} category={category} query={query} />
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center md:px-6">
          <p className="font-serif text-lg font-bold text-foreground">{t.brand}</p>
          <p className="text-xs text-muted-foreground">{t.tagline} — Live News Network</p>
        </div>
      </footer>
    </div>
  )
}
