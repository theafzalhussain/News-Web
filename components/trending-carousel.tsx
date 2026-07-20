"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { ArticleImage } from "@/components/article-image"
import { formatDate, STRINGS, type Article, type Lang } from "@/lib/i18n"

interface TrendingCarouselProps {
  articles: Article[]
  lang: Lang
}

const AUTOPLAY_MS = 6000

export function TrendingCarousel({ articles, lang }: TrendingCarouselProps) {
  const t = STRINGS[lang]
  // Prioritize articles that have images for a richer carousel
  const withImages = articles.filter((a) => a.title && a.image)
  const withoutImages = articles.filter((a) => a.title && !a.image)
  const slides = [...withImages, ...withoutImages].slice(0, 8)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const count = slides.length

  const go = useCallback(
    (next: number, dir: number) => {
      if (count === 0) return
      setDirection(dir)
      setIndex(((next % count) + count) % count)
      setProgressKey((k) => k + 1)
    },
    [count],
  )

  // Autoplay
  useEffect(() => {
    if (paused || count <= 1) return
    const id = setTimeout(() => go(index + 1, 1), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [index, paused, count, go, progressKey])

  if (count === 0) return null

  const article = slides[index]

  return (
    <section aria-label={t.trending} className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex items-center gap-3 md:mb-5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-xl font-bold text-foreground md:text-3xl">{t.trending}</h2>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="hidden font-mono text-xs tracking-widest text-muted-foreground sm:block">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </motion.div>

      {/* Carousel stage */}
      <div
        className="group/carousel relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
          setPaused(true)
        }}
        onTouchEnd={(e) => {
          setPaused(false)
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(dx) > 48) {
            if (dx < 0) go(index + 1, 1)
            else go(index - 1, -1)
          }
          touchStartX.current = null
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label={t.trending}
      >
        <div className="relative h-[340px] sm:h-[400px] md:h-[480px] lg:h-[520px]">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              custom={direction}
              initial={{ opacity: 0, x: direction * 80, scale: 1.02 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -80, scale: 0.98 }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0 block"
              aria-label={article.title}
            >
              {/* Image */}
              <div className="absolute inset-0 bg-secondary">
                <ArticleImage
                  src={article.image}
                  alt=""
                  fallbackText={t.brand.charAt(0)}
                  eager
                  sizes="(min-width: 1280px) 1280px, 100vw"
                  className="h-full w-full scale-105 object-cover transition-transform duration-[7000ms] ease-out group-hover/carousel:scale-110"
                />
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/5" />
              <div className="absolute inset-y-0 left-0 hidden w-1/2 bg-gradient-to-r from-background/70 to-transparent md:block" />

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5 pb-14 sm:p-7 sm:pb-16 md:max-w-3xl md:gap-4 md:p-10 md:pb-20">
                <div className="flex flex-wrap items-center gap-2 text-xs md:gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 font-bold uppercase tracking-wider text-white">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    {t.breaking}
                  </span>
                  {article.source?.name && (
                    <span className="rounded-full border border-primary/40 bg-background/60 px-3 py-1 font-semibold text-primary backdrop-blur-sm">
                      {article.source.name}
                    </span>
                  )}
                  <time dateTime={article.publishedAt} className="text-muted-foreground">
                    {formatDate(article.publishedAt, lang)}
                  </time>
                </div>

                <h3 className="font-serif text-xl font-bold leading-tight text-foreground text-balance sm:text-2xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                  {article.title}
                </h3>

                {article.description && (
                  <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {article.description}
                  </p>
                )}

                <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-transform duration-300 group-hover/carousel:scale-105 md:px-5 md:py-2.5 md:text-sm">
                  {t.readMore}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </motion.a>
          </AnimatePresence>

          {/* Prev / Next arrows */}
          {count > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  go(index - 1, -1)
                }}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur-md transition-all hover:border-primary hover:bg-background hover:text-primary md:left-5 md:h-11 md:w-11 md:opacity-0 md:group-hover/carousel:opacity-100"
                aria-label="Previous story"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  go(index + 1, 1)
                }}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur-md transition-all hover:border-primary hover:bg-background hover:text-primary md:right-5 md:h-11 md:w-11 md:opacity-0 md:group-hover/carousel:opacity-100"
                aria-label="Next story"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Bottom controls: progress segments + pause */}
          {count > 1 && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 px-5 pb-4 sm:px-7 md:px-10 md:pb-5">
              <div className="flex flex-1 items-center gap-1.5" role="tablist" aria-label="Slides">
                {slides.map((s, i) => (
                  <button
                    key={s.url}
                    onClick={() => go(i, i > index ? 1 : -1)}
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Story ${i + 1}`}
                    className="relative h-1 flex-1 overflow-hidden rounded-full bg-foreground/20"
                  >
                    {i < index && <span className="absolute inset-0 bg-primary/70" />}
                    {i === index && (
                      <motion.span
                        key={progressKey}
                        initial={{ width: "0%" }}
                        animate={{ width: paused ? undefined : "100%" }}
                        transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                        className="absolute inset-y-0 left-0 bg-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPaused((p) => !p)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur-md transition-colors hover:text-primary"
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              >
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail rail (desktop) */}
      {count > 1 && (
        <div className="mt-3 hidden gap-3 lg:grid lg:grid-cols-4">
          {slides.slice(0, 4).map((s, i) => {
            const active = i === index
            return (
              <button
                key={s.url}
                onClick={() => go(i, i > index ? 1 : -1)}
                className={`group/thumb flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                  active
                    ? "border-primary/60 bg-card shadow-[0_4px_20px_-8px] shadow-primary/30"
                    : "border-border bg-card/50 hover:border-primary/30 hover:bg-card"
                }`}
                aria-label={s.title}
              >
                <span
                  className={`font-mono text-lg font-bold ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`line-clamp-2 text-xs leading-snug transition-colors ${
                    active ? "font-semibold text-foreground" : "text-muted-foreground group-hover/thumb:text-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
