"use client"

import { useState } from "react"

interface ArticleImageProps {
  src?: string | null
  alt: string
  className?: string
  fallbackText?: string
  eager?: boolean
  sizes?: string
}

/**
 * News image with hotlink-safe loading:
 * - referrerPolicy="no-referrer" bypasses referrer-based hotlink blocking
 *   used by many news CDNs (e.g. TVC News).
 * - Branded serif fallback if the image is missing or fails to load.
 */
export function ArticleImage({
  src,
  alt,
  className,
  fallbackText = "T",
  eager = false,
  sizes,
}: ArticleImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary font-serif text-4xl text-muted-foreground">
        {fallbackText}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      width={800}
      height={450}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
