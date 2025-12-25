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
  Image,
  ImageBackground,
  useWindowDimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useSegments } from "expo-router"
import { useLibrary } from "../context/LibraryContext"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import BookCard, { formatViews } from "../components/BookCard"
import { fetchBooks, type Book } from "../lib/api"
import TopUpModal from "../components/TopUpModal"
import Footer from "../components/Footer"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"
const APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.bookstore.harba.app"

export default function HomeScreen() {
  const router = useRouter()
  const segments = useSegments()
  const { user } = useAuth()
  const { theme } = useTheme()
  const { readingProgress } = useLibrary()
  const windowDimensions = useWindowDimensions()
  
  const currentRoute = segments[segments.length - 1] || "index"
  const [searchQuery, setSearchQuery] = useState("")
  const { credits, isLoading: libraryLoading } = useLibrary()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const isWeb = Platform.OS === "web"
  
  // Calculate responsive padding based on window width
  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 16 // Mobile
    if (width < 1024) return width * 0.1 // Tablet
    return width * 0.2 // Desktop
  }, [windowDimensions.width])
  
  const tagShowcasePadding = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 16 // Mobile
    if (width < 1024) return width * 0.15 // Tablet
    return width * 0.31 // Desktop
  }, [windowDimensions.width])
  
  // Responsive number of columns for popular books
  const numColumns = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 1 // Mobile: 1 column
    if (width < 1024) return 2 // Tablet: 2 columns
    return 3 // Desktop: 3 columns
  }, [windowDimensions.width])

  // Calculate max width for popular book cards to prevent supersizing
  const popularBookCardMaxWidth = useMemo(() => {
    const width = windowDimensions.width
    const availableWidth = width - (horizontalPadding * 2)
    const gap = 16
    const totalGaps = (numColumns - 1) * gap
    return (availableWidth - totalGaps) / numColumns
  }, [windowDimensions.width, horizontalPadding, numColumns])
  
  // Responsive number of columns for tag showcase
  const tagColumns = useMemo(() => {
    const width = windowDimensions.width
    if (width < 640) return 2 // Mobile: 2 columns
    if (width < 1024) return 4 // Tablet: 4 columns
    return 6 // Desktop: 6 columns
  }, [windowDimensions.width])
  
  // Calculate fixed width for tag cards to ensure consistent sizing
  const tagCardWidth = useMemo(() => {
    const width = windowDimensions.width
    const availableWidth = width - (tagShowcasePadding * 2)
    const gap = 12 // columnGap from FlatList
    const totalGaps = (tagColumns - 1) * gap
    return (availableWidth - totalGaps) / tagColumns
  }, [windowDimensions.width, tagShowcasePadding, tagColumns])

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

  const getViewsValue = (book?: Book) => {
    if (!book) return 0
    const v = (book as any).views
    return typeof v === "number" ? v : 0
  }

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.book_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
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
    return getViewsValue(b) - getViewsValue(a)
  })

  const popularBooks = sortedBooks.slice(0, numColumns * 2)

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
        totalCount: list.length,
      }))
      .filter((section) => section.books.length > 0)
      .sort((a, b) => b.books.length - a.books.length)
    return entries
  }, [books])

  if (libraryLoading || isLoadingBooks) {
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
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Pressable onPress={() => router.push("/(tabs)")} style={styles.titleContainer}>
          <Ionicons name="book" size={24} color={theme.primary} />
          <Text style={[styles.titleBase]}>
            <Text style={[styles.titleNext, { color: theme.text }]}>Next</Text>
            <Text style={[styles.titlePage, { color: theme.text }]}>Page</Text>
          </Text>
        </Pressable>
        <View style={styles.headerNav}>
          <Pressable
            style={styles.navButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons 
              name="compass" 
              size={20} 
              color={currentRoute === "index" ? theme.primary : theme.textSecondary} 
            />
            {windowDimensions.width >= 640 && (
            <Text style={[
              styles.navButtonText,
              { color: currentRoute === "index" ? theme.primary : theme.textSecondary }
            ]}>Discover</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.navButton}
            onPress={() => router.push("/(tabs)/library")}
          >
            <Ionicons 
              name="book" 
              size={20} 
              color={currentRoute === "library" ? theme.primary : theme.textSecondary} 
            />
            {windowDimensions.width >= 640 && (
            <Text style={[
              styles.navButtonText,
              { color: currentRoute === "library" ? theme.primary : theme.textSecondary }
            ]}>Library</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.navButton}
            onPress={() => router.push("/(tabs)/rank")}
          >
            <Ionicons 
              name="trophy" 
              size={20} 
              color={currentRoute === "rank" ? theme.primary : theme.textSecondary} 
            />
            {windowDimensions.width >= 640 && (
            <Text style={[
              styles.navButtonText,
              { color: currentRoute === "rank" ? theme.primary : theme.textSecondary }
            ]}>Rank</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.navButton}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons 
              name="person-circle" 
              size={20} 
              color={currentRoute === "profile" ? theme.primary : theme.textSecondary} 
            />
            {windowDimensions.width >= 640 && (
            <Text style={[
              styles.navButtonText,
              { color: currentRoute === "profile" ? theme.primary : theme.textSecondary }
            ]}>Profile</Text>
            )}
          </Pressable>
        </View>
        <View style={styles.headerRight}>
          {windowDimensions.width >= 768 && (
          <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          )}
          {windowDimensions.width >= 1024 && (
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
          )}
          <View style={[styles.creditsContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="star" size={20} color={theme.primary} />
            <Text style={[styles.credits, { color: theme.primary }]}>{credits}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
        {topSlides.length > 0 && (
          <View style={[styles.heroShell, { borderColor: theme.border, marginHorizontal: -horizontalPadding }]}>
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
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {topSlides[slideIndex].book.book_name}
                  </Text>
                  <Text style={styles.heroAuthor} numberOfLines={1}>
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

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular</Text>
        <FlatList
          key={`popular-${numColumns}`}
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
              <View style={{ flex: 1, maxWidth: popularBookCardMaxWidth }}>
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
          columnWrapperStyle={numColumns > 1 ? { columnGap: 16, justifyContent: "flex-start" } : undefined}
          contentContainerStyle={{ rowGap: 16, paddingBottom: 24 }}
        />

        <View style={[styles.promoBanner, { backgroundColor: "#fce7f3", marginHorizontal: -horizontalPadding }]}>
          <View style={styles.promoBannerContent}>
            <Text style={[styles.promoBannerTitle, { color: theme.text }]}>
              Explore and Read <Text style={styles.promoBannerTitleHighlight}>Stories for FREE</Text>
            </Text>
            <Text style={[styles.promoBannerText, { color: theme.textSecondary }]}>
              Free access to a vast number of stories on the NextPage app. Download the books you like and read anywhere & anytime.
            </Text>
          </View>
        </View>

        {tagSections.map((section) => {
          // Pad to always have tagColumns items for consistent sizing
          const paddedBooks = [...section.books]
          while (paddedBooks.length < tagColumns) {
            paddedBooks.push(null as any)
          }
          return (
            <View key={section.tag} style={{ marginTop: 24, marginHorizontal: -horizontalPadding, paddingHorizontal: tagShowcasePadding }}>
              <View style={styles.tagSectionHeader}>
                <Text style={[styles.tagSectionTitle, { color: theme.text }]}>{section.tag}</Text>
                <Pressable
                  onPress={() => router.push({ pathname: "/tag/[tagName]", params: { tagName: encodeURIComponent(section.tag) } })}
                  style={styles.moreButton}
                >
                  <Text style={[styles.moreButtonText, { color: theme.primary }]}>More</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </Pressable>
              </View>
              <View style={styles.tagShowcaseContainer}>
                <FlatList
                  key={`${section.tag}-${tagColumns}`}
                  data={paddedBooks}
                  renderItem={({ item }) => {
                    if (!item) {
                      return (
                        <View style={[styles.tagCardWrapper, { width: tagCardWidth }]}>
                          <View style={[styles.tagCardPlaceholder, { backgroundColor: theme.card }]}>
                            <View style={[styles.tagCardPlaceholderImage, { backgroundColor: theme.border }]} />
                            <View style={[styles.tagCardPlaceholderMeta, { backgroundColor: theme.card }]}>
                              <View style={[styles.tagCardPlaceholderLine, { backgroundColor: theme.border }]} />
                              <View style={[styles.tagCardPlaceholderLine, { width: "60%", backgroundColor: theme.border }]} />
                              <View style={[styles.tagCardPlaceholderLine, { width: "40%", backgroundColor: theme.border }]} />
                            </View>
                          </View>
                        </View>
                      )
                    }
                    const cover =
                      (item as any).cover ||
                      (item as any).cover_url ||
                      (item as any).cover_image ||
                      DEFAULT_COVER
                      return (
                        <View style={[styles.tagCardWrapper, { width: tagCardWidth }]}>
                          <Pressable
                            style={[styles.tagCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push({ pathname: "/book/[bookId]", params: { bookId: item.book_id } })}
                          >
                          <Image source={{ uri: cover }} style={styles.tagCardImage} resizeMode="cover" />
                          <View style={[styles.tagCardMeta, { backgroundColor: theme.card }]}>
                            <Text style={[styles.tagCardTitle, { color: theme.text }]} numberOfLines={2}>
                              {item.book_name}
                            </Text>
                            <Text style={[styles.tagCardAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
                              {item.author}
                            </Text>
                            <Text style={[styles.tagCardViews, { color: theme.textSecondary }]} numberOfLines={1}>
                              {formatViews(getViewsValue(item))} views
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                    )
                  }}
                  keyExtractor={(item, index) => item ? `${section.tag}-${item.book_id}` : `${section.tag}-placeholder-${index}`}
                  scrollEnabled={false}
                  numColumns={tagColumns}
                  columnWrapperStyle={tagColumns > 1 ? { columnGap: 12, justifyContent: "center" } : undefined}
                  contentContainerStyle={{ rowGap: 16, paddingBottom: 8 }}
                />
              </View>
            </View>
          )
        })}

        {/* Footer */}
        <View style={{ marginHorizontal: -horizontalPadding }}>
          <Footer />
        </View>
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
    paddingVertical: 12,
    flexWrap: "wrap",
    gap: 12,
  },
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    flexWrap: "wrap",
    gap: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topUpButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 150,
    maxWidth: 250,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 16,
    marginBottom: 12,
  },
  tagSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagSectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  moreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  moreButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  promoBanner: {
    marginTop: 32,
    marginBottom: 16,
    borderRadius: 14,
    padding: 24,
  },
  promoBannerContent: {
    gap: 12,
    alignItems: "center",
  },
  promoBannerTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    textAlign: "center",
  },
  promoBannerTitleHighlight: {
    color: "#ec4899",
    fontWeight: "800",
  },
  promoBannerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  heroShell: {
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
    color: "#fff",
  },
  heroAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f3f4f6",
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
  tagShowcaseContainer: {
    alignItems: "center",
  },
  tagCardWrapper: {
    // Width is set dynamically via inline style
  },
  tagCardPlaceholder: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  tagCardPlaceholderImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tagCardPlaceholderMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  tagCardPlaceholderLine: {
    height: 10,
    borderRadius: 4,
    width: "80%",
  },
  tagCard: {
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  tagCardImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tagCardMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 3,
  },
  tagCardTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  tagCardAuthor: {
    fontSize: 11,
    fontWeight: "500",
  },
  tagCardViews: {
    fontSize: 11,
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
