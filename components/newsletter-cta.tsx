"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, CheckCircle2, Sparkles } from "lucide-react"
import { STRINGS, type Lang } from "@/lib/i18n"

interface NewsletterCTAProps {
  lang: Lang
}

export function NewsletterCTA({ lang }: NewsletterCTAProps) {
  const t = STRINGS[lang]
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
      setEmail("")
    }
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-12"
      >
        {/* Decorative glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" aria-hidden="true" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-destructive/10 blur-[100px]" aria-hidden="true" />

        <div className="relative flex flex-col items-center gap-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </span>

          <div className="flex flex-col gap-2">
            <h3 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
              {lang === "hi" ? "ताज़ा ख़बरें सीधे आपके इनबॉक्स में" : "Stay Ahead of the News"}
            </h3>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              {lang === "hi"
                ? "हर सुबह दुनिया भर की सबसे अहम ख़बरें, विश्लेषण और ब्रेकिंग अपडेट — बिल्कुल मुफ़्त।"
                : "Get the morning briefing: top stories, analysis, and breaking updates delivered free to your inbox."}
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-full bg-primary/10 px-6 py-3 text-primary"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">
                {lang === "hi" ? "सफलतापूर्वक सब्सक्राइब हो गया!" : "You're in! Welcome aboard."}
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === "hi" ? "आपका ईमेल पता" : "Your email address"}
                  aria-label={lang === "hi" ? "ईमेल पता" : "Email address"}
                  className="w-full rounded-full border border-border bg-secondary py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:shadow-[0_4px_20px_-4px] hover:shadow-primary/50 active:scale-[0.98]"
              >
                {lang === "hi" ? "सब्सक्राइब करें" : "Subscribe"}
              </button>
            </form>
          )}

          <p className="text-[11px] text-muted-foreground/60">
            {lang === "hi"
              ? "हम आपका ईमेल कभी शेयर नहीं करते। जब चाहें अनसब्सक्राइब करें।"
              : "No spam. Unsubscribe anytime. We respect your inbox."}
          </p>
        </div>
      </motion.div>
    </section>
  )
}
