"use client"

import { motion } from "framer-motion"
import { Calendar, ArrowUpRight, Clock, Bookmark } from "lucide-react"
import { formatDate, STRINGS, type Article, type Lang } from "@/lib/i18n"

interface NewsCardProps {
  article: Article
  lang: Lang
  index: number
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export function NewsCard({ article, lang, index }: NewsCardProps) {
  const t = STRINGS[lang]
  const readTime = estimateReadTime(`${article.title} ${article.description} ${article.content || ""}`)

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-[0_20px_60px_-20px] hover:shadow-primary/15"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {article.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-primary/5 font-serif text-5xl text-muted-foreground/30">
            {t.brand.charAt(0)}
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Source badge */}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
          {article.source?.name}
        </span>

        {/* Bookmark button */}
        <button
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-muted-foreground backdrop-blur-md opacity-0 transition-all duration-300 hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
          aria-label="Bookmark article"
        >
          <Bookmark className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, lang)}</time>
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {readTime} {lang === "hi" ? "मिनट पढ़ें" : "min read"}
          </span>
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug text-card-foreground text-pretty transition-colors duration-300 group-hover:text-primary">
          {article.title}
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {article.description}
        </p>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-300 hover:shadow-[0_4px_16px_-4px] hover:shadow-primary/40 active:scale-[0.97]"
          >
            {t.readMore}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-all duration-300 hover:border-primary hover:text-primary hover:bg-primary/5"
          >
            {lang === "hi" ? "शेयर करें" : "Share"}
          </a>
        </div>
      </div>
    </motion.article>
  )
}
