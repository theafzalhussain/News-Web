export type Lang = "en" | "hi"

export const CATEGORIES = [
  { key: "all", en: "All News", hi: "सभी समाचार" },
  { key: "world", en: "World", hi: "विश्व" },
  { key: "nation", en: "National", hi: "राष्ट्रीय" },
  { key: "politics", en: "Politics", hi: "राजनीति" },
  { key: "crime", en: "Crime", hi: "अपराध" },
  { key: "business", en: "Business", hi: "व्यापार" },
  { key: "technology", en: "Technology", hi: "प्रौद्योगिकी" },
  { key: "sports", en: "Sports", hi: "खेल" },
  { key: "entertainment", en: "Entertainment", hi: "मनोरंजन" },
  { key: "science", en: "Science", hi: "विज्ञान" },
  { key: "health", en: "Health", hi: "स्वास्थ्य" },
] as const

export const STRINGS = {
  en: {
    brand: "The Chronicle",
    tagline: "Live. Global. Premium.",
    live: "LIVE",
    trending: "Trending Now",
    latest: "Latest Stories",
    searchPlaceholder: "Search topics, e.g. elections, AI, cricket...",
    readMore: "Read Article",
    watch: "Watch",
    loading: "Loading more stories...",
    endOfFeed: "You are all caught up.",
    noResults: "No stories found. Try a different search.",
    searchResults: "Search Results",
    breaking: "Breaking",
    source: "Source",
    error: "Could not load news right now. Please try again shortly.",
    retry: "Retry",
  },
  hi: {
    brand: "द क्रॉनिकल",
    tagline: "लाइव. वैश्विक. प्रीमियम.",
    live: "लाइव",
    trending: "अभी ट्रेंडिंग",
    latest: "ताज़ा ख़बरें",
    searchPlaceholder: "विषय खोजें, जैसे चुनाव, एआई, क्रिकेट...",
    readMore: "पूरा पढ़ें",
    watch: "देखें",
    loading: "और ख़बरें लोड हो रही हैं...",
    endOfFeed: "आपने सभी ख़बरें देख लीं।",
    noResults: "कोई ख़बर नहीं मिली। कुछ और खोजें।",
    searchResults: "खोज परिणाम",
    breaking: "ब्रेकिंग",
    source: "स्रोत",
    error: "अभी समाचार लोड नहीं हो सके। कृपया थोड़ी देर में पुनः प्रयास करें।",
    retry: "पुनः प्रयास",
  },
} as const

export interface Article {
  title: string
  description: string
  content: string
  url: string
  image: string | null
  publishedAt: string
  source: { name: string; url: string }
}

export function formatDate(iso: string, lang: Lang) {
  try {
    return new Date(iso).toLocaleString(lang === "hi" ? "hi-IN" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}
