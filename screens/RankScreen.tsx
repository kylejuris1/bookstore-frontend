import { useEffect, useState, useMemo } from "react"
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Pressable, useWindowDimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { fetchBooksByViews, type Book } from "../lib/api"
import { useTheme } from "../context/ThemeContext"
import BookCard from "../components/BookCard"
import { useLibrary } from "../context/LibraryContext"
import NavigationHeader from "../components/NavigationHeader"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"

export default function RankScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { readingProgress } = useLibrary()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const windowDimensions = useWindowDimensions()
  
  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 16 // Mobile
    if (width < 1024) return width * 0.15 // Tablet
    return width * 0.31 // Desktop - 31% spacing
  }, [windowDimensions.width])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setIsLoading(true)
        const data = await fetchBooksByViews()
        if (!cancelled) setBooks(data)
      } catch (error) {
        console.error("Error loading ranked books:", error)
        if (!cancelled) setBooks([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const getViewsValue = (book?: Book) => {
    if (!book) return 0
    const v = (book as any).views
    return typeof v === "number" ? v : 0
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader />
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.title, { color: theme.text }]}>Rank</Text>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.book_id}
        contentContainerStyle={[styles.list, { paddingHorizontal: horizontalPadding }]}
        renderItem={({ item, index }) => {
          const cover =
            (item as any).cover ||
            (item as any).cover_url ||
            (item as any).cover_image ||
            DEFAULT_COVER
          const cardData = {
            id: item.book_id,
            title: item.book_name,
            author: item.author,
            cover,
            summary: item.summary || null,
            tags: item.tags || [],
            views: getViewsValue(item),
          }
          const progress = readingProgress[item.book_id]
          const lastChapter = progress?.lastChapter
          return (
            <BookCard
              book={cardData}
              rank={index + 1}
              onPress={() => {
                if (lastChapter) {
                  router.push({
                    pathname: "/reader",
                    params: { book: JSON.stringify(cardData), chapter: String(lastChapter) },
                  })
                } else {
                  router.push({ pathname: "/book/[bookId]", params: { bookId: item.book_id } })
                }
              }}
            />
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={32} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No books found</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  list: {
    paddingBottom: 16,
  },
  empty: {
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
})

