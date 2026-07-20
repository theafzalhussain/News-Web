"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Globe, Radio } from "lucide-react"
import { CATEGORIES, STRINGS, type Lang } from "@/lib/i18n"

interface NavbarProps {
  lang: Lang
  category: string
  query: string
  onCategoryChange: (cat: string) => void
  onLangChange: (lang: Lang) => void
  onSearch: (q: string) => void
}

export function Navbar({ lang, category, query, onCategoryChange, onLangChange, onSearch }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(query)
  const t = STRINGS[lang]

  const submitSearch = () => {
    onSearch(searchValue.trim())
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      {/* Top bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {/* Brand */}
        <button
          onClick={() => {
            onSearch("")
            onCategoryChange("all")
          }}
          className="flex items-center gap-3 text-left"
          aria-label="Home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Radio className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-serif text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {t.brand}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.3em] text-muted-foreground md:block">
              {t.tagline}
            </span>
          </span>
        </button>

        {/* Search (desktop) */}
        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submitSearch()
              }}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full rounded-full border border-border bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="hidden items-center gap-1.5 rounded-full border border-destructive/50 px-3 py-1 text-xs font-semibold text-destructive sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            {t.live}
          </span>

          {/* Language toggle */}
          <div
            className="flex items-center gap-1 rounded-full border border-border bg-secondary p-1"
            role="group"
            aria-label="Language"
          >
            <Globe className="ml-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l === "en" ? "EN" : "हिं"}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
            aria-label={mobileOpen ? "Close search" : "Open search"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Category bar — scrollable on all screens */}
      <nav className="border-t border-border" aria-label="News categories">
        <div className="scrollbar-hide mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 md:px-6">
          {CATEGORIES.map((cat) => {
            const active = category === cat.key && !query
            return (
              <button
                key={cat.key}
                onClick={() => {
                  onSearch("")
                  onCategoryChange(cat.key)
                }}
                className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 text-[13px] transition-colors md:px-4 md:py-3 md:text-sm ${
                  active ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {cat[lang]}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border md:hidden"
            aria-label="News categories"
          >
            <div className="flex flex-col gap-2 px-4 py-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) submitSearch()
                  }}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  className="w-full rounded-full border border-border bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 rounded-full border border-destructive/50 px-3 py-1 text-xs font-semibold text-destructive">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                  </span>
                  {t.live}
                </span>
                <button
                  onClick={submitSearch}
                  className="rounded-full bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  <Search className="mr-1.5 inline h-3 w-3" aria-hidden="true" />
                  {lang === "hi" ? "खोजें" : "Search"}
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
