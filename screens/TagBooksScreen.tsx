import { useState, useEffect, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useTheme } from "../context/ThemeContext"
import NavigationHeader from "../components/NavigationHeader"
import { fetchBooks, type Book } from "../lib/api"
import { formatViews } from "../components/BookCard"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"

interface TagBooksScreenProps {
  tagName: string
}

export default function TagBooksScreen({ tagName }: TagBooksScreenProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const windowDimensions = useWindowDimensions()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    // Smooth interpolation for tag books screen
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

  const numColumns = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 1
    if (width < 1024) return 2
    return 3
  }, [windowDimensions.width])

  // Calculate max width for book cards to prevent supersizing
  const bookCardMaxWidth = useMemo(() => {
    const width = windowDimensions.width
    const availableWidth = width - (horizontalPadding * 2)
    const gap = 16
    const totalGaps = (numColumns - 1) * gap
    return (availableWidth - totalGaps) / numColumns
  }, [windowDimensions.width, horizontalPadding, numColumns])

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoading(true)
        const allBooks = await fetchBooks()
        const filteredBooks = allBooks.filter((book) => 
          (book.tags || []).includes(tagName)
        )
        // Sort by views
        filteredBooks.sort((a, b) => {
          const viewsA = typeof (a as any).views === "number" ? (a as any).views : 0
          const viewsB = typeof (b as any).views === "number" ? (b as any).views : 0
          return viewsB - viewsA
        })
        setBooks(filteredBooks)
      } catch (error) {
        console.error("Error loading books:", error)
        setBooks([])
      } finally {
        setIsLoading(false)
      }
    }

    loadBooks()
  }, [tagName])

  const getViewsValue = (book: Book) => {
    const v = (book as any).views
    return typeof v === "number" ? v : 0
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <NavigationHeader />
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
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{tagName}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView 
        style={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.countText, { color: theme.textSecondary }]}>
          {books.length} {books.length === 1 ? "book" : "books"} found
        </Text>

        {books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No books found for this tag
            </Text>
          </View>
        ) : (
          <FlatList
            key={`tag-${numColumns}`}
            data={books}
            renderItem={({ item }) => {
              const cover =
                (item as any).cover ||
                (item as any).cover_url ||
                (item as any).cover_image ||
                DEFAULT_COVER
              return (
                <View style={{ flex: 1, maxWidth: bookCardMaxWidth }}>
                  <Pressable
                    style={[styles.bookCard, { backgroundColor: theme.card }]}
                    onPress={() => router.push({ pathname: "/book/[bookId]", params: { bookId: item.book_id } })}
                  >
                    <Image source={{ uri: cover }} style={styles.bookCover} resizeMode="cover" />
                    <View style={styles.bookInfo}>
                      <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
                        {item.book_name}
                      </Text>
                      <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.author}
                      </Text>
                      <Text style={[styles.bookViews, { color: theme.textSecondary }]}>
                        {formatViews(getViewsValue(item))} views
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )
            }}
            keyExtractor={(item) => item.book_id}
            scrollEnabled={false}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? { columnGap: 16, justifyContent: "flex-start" } : undefined}
            contentContainerStyle={{ rowGap: 16, paddingBottom: 24 }}
          />
        )}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  countText: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  bookCard: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  bookCover: {
    width: "100%",
    aspectRatio: 2 / 3,
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  bookViews: {
    fontSize: 12,
  },
})

