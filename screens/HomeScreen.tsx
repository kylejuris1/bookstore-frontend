import { useState, useEffect, useMemo } from "react"
import {
  View,
  ScrollView,
  TextInput,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  ImageBackground,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useLibrary } from "../context/LibraryContext"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import BookCard from "../components/BookCard"
import { fetchBooks, type Book } from "../lib/api"
import TopUpModal from "../components/TopUpModal"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"
const APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.bookstore.harba.app"

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { theme } = useTheme()
  const { readingProgress } = useLibrary()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const { credits, isLoading: libraryLoading } = useLibrary()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [sortOption, setSortOption] = useState<"title" | "author" | "views">("views")
  const isWeb = Platform.OS === "web"

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoadingBooks(true)
        const fetchedBooks = await fetchBooks()
        setBooks(fetchedBooks)
      } catch (error) {
        console.error("Error loading books:", error)
        setBooks([])
      } finally {
        setIsLoadingBooks(false)
      }
    }

    loadBooks()
  }, [])

  const tags = ["All", "Romance", "Fantasy", "Contemporary", "Mystery", "Thriller"]

  const getViewsValue = (book?: Book) => {
    if (!book) return 0
    const v = (book as any).views
    return typeof v === "number" ? v : 0
  }

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.book_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || selectedTag === "All" || (book.tags || []).includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const topSlides = useMemo(() => {
    const tagCounts = new Map<string, number>()
    books.forEach((book) => {
      (book.tags || []).forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)

    return topTags
      .map((tag) => {
        const candidates = books
          .filter((b) => (b.tags || []).includes(tag))
          .sort((a, b) => getViewsValue(b) - getViewsValue(a))
        const book = candidates[0]
        if (!book) return null
        const cover =
          (book as any).cover ||
          (book as any).cover_url ||
          (book as any).cover_image ||
          DEFAULT_COVER
        return { tag, book, cover }
      })
      .filter(Boolean) as { tag: string; book: Book; cover: string }[]
  }, [books])

  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    if (!topSlides.length) return
    if (slideIndex >= topSlides.length) {
      setSlideIndex(0)
      return
    }
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % topSlides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [topSlides.length, slideIndex])

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortOption === "views") {
      return getViewsValue(b) - getViewsValue(a)
    }

    if (sortOption === "author") {
      return a.author.localeCompare(b.author)
    }

    // default: title
    return a.book_name.localeCompare(b.book_name)
  })

  if (libraryLoading || isLoadingBooks) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const numColumns = 3
  const popularBooks = sortedBooks.slice(0, 6)

  const tagSections = useMemo(() => {
    const byTag = new Map<string, Book[]>()
    books.forEach((book) => {
      (book.tags || []).forEach((tag) => {
        const arr = byTag.get(tag) || []
        arr.push(book)
        byTag.set(tag, arr)
      })
    })
    const entries = [...byTag.entries()]
      .map(([tag, list]) => ({
        tag,
        books: [...list].sort((a, b) => getViewsValue(b) - getViewsValue(a)).slice(0, 6),
      }))
      .filter((section) => section.books.length > 0)
      .sort((a, b) => b.books.length - a.books.length)
      .slice(0, 5)
    return entries
  }, [books])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.titleBase]}>
          <Text style={[styles.titleNext, { color: theme.text }]}>Next</Text>
          <Text style={[styles.titlePage, { color: theme.text }]}>Page</Text>
        </Text>
        <View style={styles.headerRight}>
          <Pressable 
            style={[styles.topUpButton, { backgroundColor: theme.primary }]} 
            onPress={() => {
              if (isWeb) {
                Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
                return
              }
              setShowTopUpModal(true)
            }}
          >
            <Text style={styles.topUpButtonText}>Continue Reading for FREE</Text>
          </Pressable>
          <View style={[styles.creditsContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="star" size={20} color={theme.primary} />
            <Text style={[styles.credits, { color: theme.primary }]}>{credits}</Text>
          </View>
        </View>
      </View>

      {topSlides.length > 0 && (
        <View style={[styles.heroShell, { borderColor: theme.border }]}>
          <Pressable
            style={styles.heroPressable}
            onPress={() =>
              router.push({ pathname: "/book/[bookId]", params: { bookId: topSlides[slideIndex].book.book_id } })
            }
          >
            <ImageBackground
              source={{ uri: topSlides[slideIndex].cover }}
              style={styles.heroImage}
              imageStyle={styles.heroImageRadius}
              resizeMode="cover"
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={[styles.heroTag, { color: theme.primary }]}>Top in {topSlides[slideIndex].tag}</Text>
                <Text style={[styles.heroTitle, { color: theme.text }]} numberOfLines={1}>
                  {topSlides[slideIndex].book.book_name}
                </Text>
                <Text style={[styles.heroAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                  by {topSlides[slideIndex].book.author}
                </Text>
              </View>
            </ImageBackground>
          </Pressable>
          <View style={styles.heroDots}>
            {topSlides.map((_, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.heroDot,
                  {
                    backgroundColor: idx === slideIndex ? theme.primary : theme.border,
                    opacity: idx === slideIndex ? 1 : 0.6,
                  },
                ]}
                onPress={() => setSlideIndex(idx)}
              />
            ))}
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by title or author..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.tagsContainer}>
          <FlatList
            horizontal
            data={tags}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.tagButton, 
                  { backgroundColor: theme.card },
                  selectedTag === item && { backgroundColor: theme.primary }
                ]}
                onPress={() => setSelectedTag(item)}
              >
                <Text style={[
                  styles.tagText, 
                  { color: theme.textSecondary },
                  selectedTag === item && { color: theme.primaryForeground }
                ]}>{item}</Text>
              </Pressable>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>Sort by</Text>
          <View style={styles.sortPills}>
            {[
              { key: "views", label: "Most viewed" },
              { key: "title", label: "Title" },
              { key: "author", label: "Author" },
            ].map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.sortPill,
                  { borderColor: theme.border },
                  sortOption === option.key && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSortOption(option.key as any)}
              >
                <Text
                  style={[
                    styles.sortPillText,
                    { color: sortOption === option.key ? theme.primaryForeground : theme.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular</Text>
        <FlatList
          data={popularBooks}
          renderItem={({ item }) => {
            // Convert Supabase book format to BookCard format
            const cover =
              (item as any).cover ||
              (item as any).cover_url ||
              (item as any).cover_image
            const bookCardData = {
              id: item.book_id,
              title: item.book_name,
              author: item.author,
              cover: cover || null,
              summary: item.summary || null,
              tags: item.tags || [],
              views: getViewsValue(item),
            }
            const progress = readingProgress[item.book_id]
            const hasProgress = !!progress
            const lastChapter = progress?.lastChapter
            return (
              <View style={{ flex: 1 }}>
              <BookCard 
                book={bookCardData} 
                onPress={() => {
                  if (hasProgress && lastChapter) {
                    router.push({
                      pathname: "/reader",
                      params: { book: JSON.stringify(bookCardData), chapter: String(lastChapter) },
                    })
                  } else {
                    router.push({ pathname: "/book/[bookId]", params: { bookId: item.book_id } })
                  }
                }} 
              />
              </View>
            )
          }}
          keyExtractor={(item) => item.book_id}
          scrollEnabled={false}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { columnGap: 16 } : undefined}
          contentContainerStyle={{ rowGap: 16, paddingBottom: 24 }}
        />

        {tagSections.map((section) => (
          <View key={section.tag} style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.tag}</Text>
            <FlatList
              data={section.books}
              renderItem={({ item }) => {
                const cover =
                  (item as any).cover ||
                  (item as any).cover_url ||
                  (item as any).cover_image ||
                  DEFAULT_COVER
                return (
                  <View style={{ flex: 1 }}>
                    <Pressable
                      style={styles.tagCard}
                      onPress={() => router.push({ pathname: "/book/[bookId]", params: { bookId: item.book_id } })}
                    >
                      <ImageBackground
                        source={{ uri: cover }}
                        style={styles.tagCardImage}
                        imageStyle={styles.tagCardImageRadius}
                        resizeMode="cover"
                      />
                      <View style={styles.tagCardMeta}>
                        <Text style={[styles.tagCardTitle, { color: theme.text }]} numberOfLines={2}>
                          {item.book_name}
                        </Text>
                        <Text style={[styles.tagCardAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                          {item.author}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                )
              }}
              keyExtractor={(item) => `${section.tag}-${item.book_id}`}
              scrollEnabled={false}
              numColumns={3}
              columnWrapperStyle={{ columnGap: 12 }}
              contentContainerStyle={{ rowGap: 16, paddingBottom: 8 }}
            />
          </View>
        ))}
      </ScrollView>

      {!isWeb && <TopUpModal visible={showTopUpModal} onClose={() => setShowTopUpModal(false)} />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleBase: {
    fontSize: 28,
    flexDirection: "row",
  },
  titleNext: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  titlePage: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  creditsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  credits: {
    color: "#d4876f",
    fontSize: 16,
    fontWeight: "600",
  },
  topUpButton: {
    backgroundColor: "#d4876f",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  topUpButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  tagsContainer: {
    marginVertical: 12,
  },
  sortContainer: {
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  sortPills: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tagButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
  },
  tagButtonActive: {
    backgroundColor: "#d4876f",
  },
  tagText: {
    color: "#9b7b6f",
    fontSize: 13,
    fontWeight: "500",
  },
  tagTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: 16,
    marginBottom: 12,
  },
  heroShell: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  heroPressable: {
    borderRadius: 14,
    overflow: "hidden",
  },
  heroImage: {
    height: 280,
    width: "100%",
    justifyContent: "flex-end",
  },
  heroImageRadius: {
    borderRadius: 14,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroContent: {
    padding: 16,
    gap: 6,
  },
  heroTag: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  heroAuthor: {
    fontSize: 14,
    fontWeight: "600",
  },
  heroDots: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  heroDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  tagCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
  },
  tagCardImage: {
    height: 140,
    width: "100%",
  },
  tagCardImageRadius: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tagCardMeta: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  tagCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  tagCardAuthor: {
    fontSize: 12,
    fontWeight: "500",
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  authModalContent: {
    width: "100%",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  authModalText: {
    fontSize: 14,
    textAlign: "center",
  },
  authModalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  authModalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  authModalButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
})
