"use client"

import { motion } from "framer-motion"
import { Calendar, ArrowUpRight, Play } from "lucide-react"
import { ArticleImage } from "@/components/article-image"
import { formatDate, STRINGS, type Article, type Lang } from "@/lib/i18n"

interface NewsCardProps {
  article: Article
  lang: Lang
  index: number
}

export function NewsCard({ article, lang, index }: NewsCardProps) {
  const t = STRINGS[lang]

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
      style={{ contentVisibility: "auto", containIntrinsicSize: "420px" }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_40px_-12px] hover:shadow-primary/20"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <ArticleImage
          src={article.image}
          alt={article.title}
          fallbackText={t.brand.charAt(0)}
          eager={index < 3}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {article.source?.name}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, lang)}</time>
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug text-card-foreground text-pretty group-hover:text-primary transition-colors">
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
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t.readMore}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            {t.watch}
          </a>
        </div>
      </div>
    </motion.article>
  )
}
