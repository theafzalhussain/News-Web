"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { BreakingTicker } from "@/components/breaking-ticker"
import { ScrollProgress } from "@/components/scroll-progress"
import { TrendingCarousel } from "@/components/trending-carousel"
import { NewsFeed } from "@/components/news-feed"
import { NewsletterCTA } from "@/components/newsletter-cta"
import { PremiumFooter } from "@/components/premium-footer"
import { BackToTop } from "@/components/back-to-top"
import { STRINGS, type Article, type Lang } from "@/lib/i18n"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

  const handleCategoryChange = useCallback((cat: string) => {
    setCategory(cat)
    // Scroll back to top for a fresh feed
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const showTrending = !query

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <BreakingTicker articles={trendingData?.articles ?? []} lang={lang} />

      <Navbar
        lang={lang}
        category={category}
        query={query}
        onCategoryChange={handleCategoryChange}
        onLangChange={setLang}
        onSearch={setQuery}
      />

      <main>
        {showTrending && <TrendingCarousel articles={trendingData?.articles ?? []} lang={lang} />}
        <NewsFeed lang={lang} category={category} query={query} />
        <NewsletterCTA lang={lang} />
      </main>

      <PremiumFooter lang={lang} />
      <BackToTop />
    </div>
  )
}
