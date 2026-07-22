"use client"

import { useEffect, useState } from "react"
import { motion, useSpring } from "framer-motion"

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const scaleX = useSpring(0, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        const p = window.scrollY / scrollHeight
        setProgress(p)
        scaleX.set(p)
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [scaleX])

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-primary via-primary/80 to-destructive"
      style={{ scaleX }}
      aria-hidden="true"
    />
  )
}
