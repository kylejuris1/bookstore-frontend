import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, Pressable, SafeAreaView, ScrollView, ActivityIndicator, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"
import BookCard from "../components/BookCard"
import { Image } from "react-native"
import { fetchBooks, type Book } from "../lib/api"

export default function LibraryScreen() {
  const router = useRouter()
  const { theme } = useTheme()
  const { bookmarkedBooks, readingProgress, getLastReadChapter } = useLibrary()
  const [activeTab, setActiveTab] = useState<"bookmarks" | "history">("bookmarks")
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchBooks()
        if (!cancelled) setBooks(data)
      } catch (err) {
        console.error("Error loading books for library:", err)
        if (!cancelled) setBooks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const booksById = useMemo(() => {
    const map: Record<string, Book> = {}
    books.forEach((b) => {
      map[b.book_id] = b
    })
    return map
  }, [books])

  // Get bookmarked books
  const bookmarkedBooksData = bookmarkedBooks
    .map((id) => booksById[id])
    .filter((b): b is Book => !!b)

  // Get reading history (books with progress)
  const readingHistory = Object.values(readingProgress)
    .map((progress) => {
      const book = booksById[progress.bookId]
      if (!book) return null
      return { book, progress }
    })
    .filter((item): item is { book: Book; progress: typeof readingProgress[keyof typeof readingProgress] } => !!item)
    .sort((a, b) => b.progress.lastReadAt - a.progress.lastReadAt)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const toCardData = (item: Book) => {
    const cover = (item as any).cover || (item as any).cover_url || (item as any).cover_image || null
    return {
      id: item.book_id,
      title: item.book_name,
      author: item.author,
      cover,
      summary: (item as any).summary || null,
      tags: item.tags || [],
      views: (item as any).views,
    }
  }

  const renderBookItem = (item: Book, showProgress = false) => {
    const card = toCardData(item)
    const progress = readingProgress[card.id]
    const lastChapter = progress?.lastChapter
    return (
      <View style={styles.bookItem}>
        <BookCard
          book={card}
          onPress={() => {
            if (progress && lastChapter) {
              router.push({
                pathname: "/reader",
                params: { book: JSON.stringify(card), chapter: String(lastChapter) },
              })
            } else {
              router.push({ pathname: "/book/[bookId]", params: { bookId: card.id } })
            }
          }}
        />
        {showProgress && progress && (
          <View style={styles.progressBadge}>
            <Ionicons name="bookmark" size={12} color="#d4876f" />
            <Text style={styles.progressText}>Chapter {progress.lastChapter}</Text>
          </View>
        )}
      </View>
    )
  }

  if (loading) {
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
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Library</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab, 
            { backgroundColor: theme.card },
            activeTab === "bookmarks" && { backgroundColor: theme.muted }
          ]}
          onPress={() => setActiveTab("bookmarks")}
        >
          <Ionicons
            name={activeTab === "bookmarks" ? "bookmark" : "bookmark-outline"}
            size={20}
            color={activeTab === "bookmarks" ? theme.primary : theme.textSecondary}
          />
          <Text style={[
            styles.tabText, 
            { color: theme.textSecondary },
            activeTab === "bookmarks" && { color: theme.primary }
          ]}>Bookmarks</Text>
          {bookmarkedBooksData.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{bookmarkedBooksData.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[
            styles.tab, 
            { backgroundColor: theme.card },
            activeTab === "history" && { backgroundColor: theme.muted }
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name={activeTab === "history" ? "time" : "time-outline"}
            size={20}
            color={activeTab === "history" ? theme.primary : theme.textSecondary}
          />
          <Text style={[
            styles.tabText, 
            { color: theme.textSecondary },
            activeTab === "history" && { color: theme.primary }
          ]}>History</Text>
          {readingHistory.length > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{readingHistory.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeTab === "bookmarks" ? (
        bookmarkedBooksData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Bookmarks Yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Bookmark books to save them for later reading</Text>
          </View>
        ) : (
          <FlatList
            data={bookmarkedBooksData}
            renderItem={({ item }) => renderBookItem(item)}
            keyExtractor={(item) => item.book_id}
            numColumns={1}
            contentContainerStyle={styles.content}
          />
        )
      ) : readingHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={theme.primary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Reading History</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Start reading books to see your history here</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {readingHistory.map(({ book, progress }) => {
            const coverUri =
              (book as any).cover || (book as any).cover_url || (book as any).cover_image || null
            const lastChapter = progress?.lastChapter
            return (
            <Pressable
              key={book.book_id}
              style={[styles.historyItem, { backgroundColor: theme.card }]}
              onPress={() => {
                router.push({
                  pathname: "/reader",
                  params: {
                    book: JSON.stringify(toCardData(book)),
                    ...(lastChapter ? { chapter: String(lastChapter) } : {}),
                  },
                })
              }}
            >
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.historyCover} />
              ) : (
                <View style={[styles.historyCover, styles.historyCoverPlaceholder, { backgroundColor: theme.muted }]}>
                  <Ionicons name="book" size={24} color={theme.textSecondary} />
                </View>
              )}
              <View style={styles.historyContent}>
                <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>
                  {book.book_name}
                </Text>
                <Text style={[styles.historyAuthor, { color: theme.textSecondary }]}>{book.author}</Text>
                <View style={styles.historyFooter}>
                  <View style={styles.progressInfo}>
                    <Ionicons name="bookmark" size={14} color={theme.primary} />
                    <Text style={[styles.progressInfoText, { color: theme.primary }]}>
                      Chapter {progress.lastChapter}
                    </Text>
                  </View>
                  <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                    {formatDate(progress.lastReadAt)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </Pressable>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const screenWidth = Dimensions.get("window").width
const horizontalPadding = screenWidth * 0.2 // 20% on each side

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: horizontalPadding,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    position: "relative",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  content: {
    paddingHorizontal: horizontalPadding,
    paddingVertical: 12,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
    gap: '4%', // Use percentage gap instead of fixed pixels
  },
  bookItem: {
    flex: 1,
    position: "relative",
  },
  progressBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  historyCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  historyCoverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  historyAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressInfoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  historyDate: {
    fontSize: 12,
  },
})
