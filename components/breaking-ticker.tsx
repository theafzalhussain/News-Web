"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { STRINGS, type Article, type Lang } from "@/lib/i18n"

interface BreakingTickerProps {
  articles: Article[]
  lang: Lang
}

export function BreakingTicker({ articles, lang }: BreakingTickerProps) {
  const t = STRINGS[lang]
  const headlines = articles.filter((a) => a.title).slice(0, 10)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId: number
    let pos = 0
    const speed = 0.5

    const tick = () => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [headlines.length])

  if (!headlines.length) return null

  const repeated = [...headlines, ...headlines]

  return (
    <div className="relative w-full overflow-hidden border-b border-border bg-destructive/10 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center">
        {/* LIVE badge */}
        <div className="z-10 flex shrink-0 items-center gap-2 border-r border-destructive/30 bg-destructive px-4 py-2">
          <Zap className="h-3.5 w-3.5 fill-white text-white" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">{t.breaking}</span>
        </div>

        {/* Scrolling headlines */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex items-center gap-8 overflow-hidden whitespace-nowrap px-4 py-2"
          aria-label="Breaking news headlines"
        >
          {repeated.map((article, i) => (
            <span key={`${article.url}-${i}`} className="inline-flex items-center gap-3 text-sm text-foreground/80">
              <span className="h-1 w-1 shrink-0 rounded-full bg-destructive" />
              <span className="line-clamp-1 font-medium">{article.title}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
