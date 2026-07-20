"use client"

import { motion } from "framer-motion"
import { TrendingUp, ArrowUpRight, Calendar } from "lucide-react"
import { formatDate, STRINGS, type Article, type Lang } from "@/lib/i18n"

interface TrendingHeroProps {
  articles: Article[]
  lang: Lang
}

export function TrendingHero({ articles, lang }: TrendingHeroProps) {
  const t = STRINGS[lang]
  if (!articles.length) return null

  const [main, ...side] = articles.slice(0, 4)

  return (
    <section aria-label={t.trending} className="mx-auto max-w-7xl px-4 pt-8 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-5 flex items-center gap-3"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">{t.trending}</h2>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Main featured story */}
        <motion.a
          href={main.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="group relative block overflow-hidden rounded-2xl border border-border lg:col-span-3"
        >
          <div className="relative aspect-[16/10] w-full bg-secondary lg:aspect-auto lg:h-full lg:min-h-[420px]">
            {main.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={main.image}
                alt={main.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:p-8">
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-destructive px-3 py-1 font-bold uppercase tracking-wider text-white">
                  {t.breaking}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  <time dateTime={main.publishedAt}>{formatDate(main.publishedAt, lang)}</time>
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold leading-tight text-foreground text-balance md:text-4xl">
                {main.title}
              </h3>
              <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {main.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {t.readMore}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </motion.a>

        {/* Side stories */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {side.map((article, i) => (
            <motion.a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="group flex flex-1 gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {article.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-primary">{article.source?.name}</span>
                <h4 className="line-clamp-2 font-serif text-sm font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors md:text-base">
                  {article.title}
                </h4>
                <time dateTime={article.publishedAt} className="text-xs text-muted-foreground">
                  {formatDate(article.publishedAt, lang)}
                </time>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
