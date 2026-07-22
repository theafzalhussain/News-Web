"use client"

import { motion } from "framer-motion"
import { Radio, Globe, Code2, Users, Rss, ArrowUpRight, Heart } from "lucide-react"
import { STRINGS, CATEGORIES, type Lang } from "@/lib/i18n"

interface PremiumFooterProps {
  lang: Lang
}

export function PremiumFooter({ lang }: PremiumFooterProps) {
  const t = STRINGS[lang]
  const currentYear = new Date().getFullYear()

  const footerCategories = CATEGORIES.slice(0, 8)
  const socialLinks = [
    { icon: Globe, label: "Website", href: "#" },
    { icon: Code2, label: "GitHub", href: "#" },
    { icon: Users, label: "Community", href: "#" },
    { icon: Rss, label: "RSS Feed", href: "/api/news" },
  ]

  return (
    <footer className="relative border-t border-border bg-card/50">
      {/* Decorative top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:px-6">
        {/* Main footer grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 lg:col-span-1"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Radio className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <span className="block font-serif text-xl font-bold text-foreground">{t.brand}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t.tagline}</span>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {lang === "hi"
                ? "दुनिया भर की ताज़ा ख़बरें, विश्लेषण और ब्रेकिंग अपडेट — एक ही जगह पर। भरोसेमंद, तेज़ और प्रीमियम।"
                : "Breaking news, in-depth analysis, and real-time updates from around the globe. Trusted, fast, and premium."}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Categories column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
              {lang === "hi" ? "श्रेणियाँ" : "Categories"}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {footerCategories.map((cat) => (
                <li key={cat.key}>
                  <span className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary cursor-pointer">
                    <span className="h-1 w-1 rounded-full bg-border transition-colors group-hover:bg-primary" />
                    {cat[lang]}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Quick Links column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
              {lang === "hi" ? "त्वरित लिंक" : "Quick Links"}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { label: lang === "hi" ? "होम" : "Home", href: "/" },
                { label: lang === "hi" ? "ट्रेंडिंग" : "Trending", href: "#trending" },
                { label: lang === "hi" ? "ताज़ा ख़बरें" : "Latest News", href: "#latest" },
                { label: "RSS Feed", href: "/api/news" },
                { label: lang === "hi" ? "गोपनीयता" : "Privacy Policy", href: "#" },
                { label: lang === "hi" ? "शर्तें" : "Terms of Service", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span className="h-1 w-1 rounded-full bg-border transition-colors group-hover:bg-primary" />
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* About column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
              {lang === "hi" ? "हमारे बारे में" : "About"}
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {lang === "hi"
                ? "The Chronicle एक प्रीमियम न्यूज़ प्लेटफ़ॉर्म है जो दुनिया भर से ताज़ा और भरोसेमंद ख़बरें प्रदान करता है।"
                : "The Chronicle is a premium news platform delivering real-time, trusted stories from around the world."}
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="text-xs font-semibold text-destructive">
                {t.live} — {lang === "hi" ? "अपडेट जारी" : "Updates Rolling In"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-8 md:flex-row md:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {t.brand}. {lang === "hi" ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            {lang === "hi" ? "बनाया गया" : "Crafted with"}
            <Heart className="h-3 w-3 fill-destructive text-destructive" />
            {lang === "hi" ? "द्वारा" : "by"} {t.brand} {lang === "hi" ? "टीम" : "Team"}
          </p>
        </div>
      </div>
    </footer>
  )
}
