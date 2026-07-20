"use client"

import { useState } from "react"
import useSWR from "swr"
import { Navbar } from "@/components/navbar"
import { TrendingHero } from "@/components/trending-hero"
import { NewsFeed } from "@/components/news-feed"
import { STRINGS, type Article, type Lang } from "@/lib/i18n"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function NewsApp() {
  const [lang, setLang] = useState<Lang>("en")
  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")
  const t = STRINGS[lang]

  // Trending: always the freshest top headlines for the selected language
  const { data: trendingData } = useSWR<{ articles: Article[] }>(
    `/api/news?category=general&lang=${lang}&page=1`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 5 * 60 * 1000 },
  )

  const showTrending = !query

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        lang={lang}
        category={category}
        query={query}
        onCategoryChange={setCategory}
        onLangChange={setLang}
        onSearch={setQuery}
      />

      <main>
        {showTrending && <TrendingHero articles={trendingData?.articles ?? []} lang={lang} />}
        <NewsFeed lang={lang} category={category} query={query} />
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 text-center md:px-6">
          <p className="font-serif text-lg font-bold text-foreground">{t.brand}</p>
          <p className="text-xs text-muted-foreground">
            {t.tagline} — Powered by GNews API
          </p>
        </div>
      </footer>
    </div>
  )
}
