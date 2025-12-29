import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, ActivityIndicator, Pressable, useWindowDimensions, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { fetchBook, fetchChapters, logBookView, type Book } from "../lib/api"
import { useTheme } from "../context/ThemeContext"
import { useLibrary } from "../context/LibraryContext"
import NavigationHeader from "../components/NavigationHeader"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"

const formatViews = (views?: number) => {
  const v = typeof views === "number" ? views : 0
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return `${v}`
}

export default function BookDetailsScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams()
  const bookId = useMemo(() => (params.bookId as string) || "", [params.bookId])
  const { readingProgress, isBookmarked, toggleBookmark } = useLibrary()
  const windowDimensions = useWindowDimensions()
  
  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    // Smooth interpolation for book details
    if (width < 640) {
      return 16
    } else if (width < 1024) {
      const minPadding = 16
      const maxPadding = width * 0.15
      const ratio = (width - 640) / (1024 - 640)
      return minPadding + (maxPadding - minPadding) * ratio
    } else if (width < 1920) {
      const minPadding = width * 0.15
      const maxPadding = Math.min(width * 0.31, 595)
      const ratio = (width - 1024) / (1920 - 1024)
      return minPadding + (maxPadding - minPadding) * ratio
    } else {
      return Math.min(width * 0.31, 595)
    }
  }, [windowDimensions.width])

  const [book, setBook] = useState<Book | null>(null)
  const [chaptersCount, setChaptersCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookId) {
      setError("Book not found")
      setIsLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        const [bookData, chapters] = await Promise.all([
          fetchBook(bookId),
          fetchChapters(bookId),
        ])
        if (cancelled) return
        if (!bookData) {
          setError("Book not found")
          return
        }
        setBook(bookData)
        setChaptersCount(chapters.length)
      } catch (err) {
        console.error("Error loading book details:", err)
        if (!cancelled) setError("Failed to load book")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bookId])

  // Log a view when the book details page is viewed (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && bookId && book) {
      logBookView(bookId).catch((error) => {
        console.error('Failed to log book view on web:', error)
      })
    }
  }, [bookId, book])

  const handleRead = () => {
    if (!book) return
    const cover =
      (book as any).cover ||
      (book as any).cover_url ||
      (book as any).cover_image ||
      null
    const cardData = {
      id: book.book_id,
      title: book.book_name,
      author: book.author,
      cover: cover || null,
      summary: (book as any).summary || null,
      tags: book.tags || [],
      views: (book as any).views,
    }
    const progress = readingProgress[book.book_id]
    const chapter = progress?.lastChapter ? String(progress.lastChapter) : undefined
    router.push({
      pathname: "/reader",
      params: {
        book: JSON.stringify(cardData),
        ...(chapter ? { chapter } : {}),
      },
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !book) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.error}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error || "Book not found"}</Text>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.card }]}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const cover =
    (book as any).cover ||
    (book as any).cover_url ||
    (book as any).cover_image ||
    DEFAULT_COVER
  const summary = (book as any).summary || ""
  const views = (book as any).views

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: theme.card, paddingHorizontal: horizontalPadding }]}>
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <View style={styles.heroActions}>
              <Pressable onPress={() => book && toggleBookmark(book.book_id)} hitSlop={8}>
                <Ionicons 
                  name={book && isBookmarked(book.book_id) ? "bookmark" : "bookmark-outline"} 
                  size={22} 
                  color={book && isBookmarked(book.book_id) ? theme.primary : theme.text} 
                />
              </Pressable>
            </View>
          </View>
          <View style={styles.heroContent}>
            <Image source={{ uri: cover }} style={styles.cover} />
            <View style={styles.meta}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                {book.book_name}
              </Text>
              <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
                {book.author}
              </Text>
              <Text style={[styles.submeta, { color: theme.textSecondary }]}>
                Words: — | Ongoing
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border, marginHorizontal: horizontalPadding }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{formatViews(views)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>Not enough ratings</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</Text>
          </View>
        </View>

        <View style={[styles.tagsSection, { marginHorizontal: horizontalPadding }]}>
          <View style={styles.tagsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
          </View>
          <View style={styles.tagsWrap}>
            {(book.tags || []).map((tag) => (
              <Pressable
                key={tag}
                onPress={() => router.push({ pathname: "/tag/[tagName]", params: { tagName: encodeURIComponent(tag) } })}
              >
                <View style={[styles.tag, { backgroundColor: theme.muted }]}>
                  <Text style={[styles.tagText, { color: theme.text }]}>{tag}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.summarySection, { marginHorizontal: horizontalPadding }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Summary</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]}>{summary}</Text>
        </View>

        <View style={[styles.chaptersHeader, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Chapters</Text>
          <Text style={[styles.chaptersMeta, { color: theme.textSecondary }]}>
            {chaptersCount} chapters
          </Text>
        </View>
      </ScrollView>

      <Pressable style={[styles.readButton, { backgroundColor: theme.primary, left: horizontalPadding, right: horizontalPadding }]} onPress={handleRead}>
        <Text style={styles.readButtonText}>Read</Text>
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 80,
  },
  hero: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroActions: {
    flexDirection: "row",
    gap: 12,
  },
  heroContent: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },
  cover: {
    width: 180,
    height: 270,
    borderRadius: 12,
  },
  meta: {
    flex: 1,
    gap: 6,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  author: {
    fontSize: 14,
    fontWeight: "600",
  },
  submeta: {
    fontSize: 12,
    fontWeight: "500",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flex: 1,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  summarySection: {
    marginTop: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsSection: {
    marginTop: 16,
  },
  tagsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chaptersHeader: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chaptersMeta: {
    fontSize: 14,
    fontWeight: "600",
  },
  readButton: {
    position: "absolute",
    bottom: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  readButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
  },
})

