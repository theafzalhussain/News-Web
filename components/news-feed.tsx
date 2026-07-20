"use client"

import { useEffect, useMemo, useRef } from "react"
import useSWRInfinite from "swr/infinite"
import { motion } from "framer-motion"
import { Loader2, Newspaper, CheckCircle2 } from "lucide-react"
import { NewsCard } from "@/components/news-card"
import { STRINGS, type Article, type Lang } from "@/lib/i18n"

interface FeedPage {
  articles: Article[]
  endOfFeed?: boolean
  error?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface NewsFeedProps {
  lang: Lang
  category: string
  query: string
  onFirstPage?: (articles: Article[]) => void
}

export function NewsFeed({ lang, category, query, onFirstPage }: NewsFeedProps) {
  const t = STRINGS[lang]
  const sentinelRef = useRef<HTMLDivElement>(null)

  const getKey = (pageIndex: number, previousPageData: FeedPage | null) => {
    if (previousPageData && (previousPageData.endOfFeed || !previousPageData.articles?.length)) {
      return null
    }
    const params = new URLSearchParams({
      lang,
      page: String(pageIndex + 1),
      ...(query ? { q: query } : { category }),
    })
    return `/api/news?${params.toString()}`
  }

  const { data, error, size, setSize, isValidating, isLoading } = useSWRInfinite<FeedPage>(
    getKey,
    fetcher,
    { revalidateFirstPage: false, revalidateOnFocus: false },
  )

  // Dedupe articles across pages by URL
  const { articles, reachedEnd } = useMemo(() => {
    const seen = new Set<string>()
    const deduped: Article[] = []
    let end = false
    let hadDuplicateOnlyPage = false

    for (const page of data ?? []) {
      if (page?.endOfFeed) end = true
      let newInPage = 0
      for (const a of page?.articles ?? []) {
        if (a?.url && !seen.has(a.url)) {
          seen.add(a.url)
          deduped.push(a)
          newInPage++
        }
      }
      // Free-plan APIs may return identical pages; stop when nothing new arrives
      if ((page?.articles?.length ?? 0) > 0 && newInPage === 0) hadDuplicateOnlyPage = true
    }

    return { articles: deduped, reachedEnd: end || hadDuplicateOnlyPage }
  }, [data])

  // Report trending articles (first page) to parent
  const firstPageArticles = data?.[0]?.articles
  useEffect(() => {
    if (firstPageArticles?.length && onFirstPage) onFirstPage(firstPageArticles)
  }, [firstPageArticles, onFirstPage])

  const isLoadingMore = isValidating && size > 1

  // Infinite scroll observer
  useEffect(() => {
    if (reachedEnd) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isValidating) {
          setSize((s) => s + 1)
        }
      },
      { rootMargin: "600px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reachedEnd, isValidating, setSize])

  const apiError = error || data?.[0]?.error

  return (
    <section aria-label={query ? t.searchResults : t.latest} className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-3"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Newspaper className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          {query ? `${t.searchResults}: "${query}"` : t.latest}
        </h2>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </motion.div>

      {/* Initial loading skeleton */}
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-[16/9] bg-secondary" />
              <div className="flex flex-col gap-3 p-5">
                <div className="h-3 w-24 rounded bg-secondary" />
                <div className="h-5 w-full rounded bg-secondary" />
                <div className="h-5 w-3/4 rounded bg-secondary" />
                <div className="h-3 w-full rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && apiError && articles.length === 0 && (
        <div className="rounded-xl border border-destructive/40 bg-card p-8 text-center">
          <p className="text-muted-foreground">{t.error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !apiError && articles.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{t.noResults}</p>
        </div>
      )}

      {/* Article grid */}
      {articles.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <NewsCard key={article.url} article={article} lang={lang} index={i} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel + loader */}
      <div ref={sentinelRef} className="flex items-center justify-center py-10" aria-live="polite">
        {isLoadingMore && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            {t.loading}
          </span>
        )}
        {reachedEnd && articles.length > 0 && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.endOfFeed}
          </span>
        )}
      </div>
    </section>
  )
}
