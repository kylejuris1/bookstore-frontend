import { useEffect, useState, useMemo } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Image, ActivityIndicator, Platform, Linking, useWindowDimensions } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { fetchBook, fetchChapters, type Book, type Chapter } from "../../lib/api"
import PromotionalBanner from "../../components/PromotionalBanner"
import { MetaPixelEvent } from "../../lib/MetaPixelEvent"

const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6756338644"
const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"

export default function LandingPage() {
  const { bookId } = useLocalSearchParams()
  const windowDimensions = useWindowDimensions()
  const isWeb = Platform.OS === "web"
  
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)

  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
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

  useEffect(() => {
    if (!bookId || typeof bookId !== "string") {
      setError("Book ID is required")
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadBook = async () => {
      try {
        setIsLoading(true)
        const [bookData, allChapters] = await Promise.all([
          fetchBook(bookId),
          fetchChapters(bookId),
        ])
        
        if (cancelled) return
        
        if (!bookData) {
          setError("Book not found")
          return
        }

        // Get first 5 chapters
        const firstFiveChapters = allChapters
          .filter(ch => ch.chapter_number <= 5)
          .sort((a, b) => a.chapter_number - b.chapter_number)

        setBook(bookData)
        setChapters(firstFiveChapters)
        
        // Debug: Log image URLs
        console.log("Book data:", {
          ad_image: bookData.ad_image,
          cover: bookData.cover,
          finalImageUrl: bookData.ad_image || bookData.cover || DEFAULT_COVER
        })
      } catch (err) {
        console.error("Error loading book:", err)
        if (!cancelled) setError("Failed to load book")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadBook()
    return () => {
      cancelled = true
    }
  }, [bookId])

  const handleContinueReading = () => {
    // Fire Meta Pixel event
    void MetaPixelEvent.track("ClickButtonContinueReading")
    Linking.openURL(APP_DOWNLOAD_URL).catch(() => {
      console.error("Failed to open app download URL")
    })
  }

  const handlePromotionalClick = () => {
    // Fire Meta Pixel event
    void MetaPixelEvent.track("ClickButtonContinueReading")
    Linking.openURL(APP_DOWNLOAD_URL).catch(() => {
      console.error("Failed to open app download URL")
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <PromotionalBanner />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF69B4" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !book) {
    return (
      <SafeAreaView style={styles.container}>
        <PromotionalBanner />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || "Book not found"}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <PromotionalBanner />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image space at top */}
        <View style={[styles.imageContainer, { marginLeft: -horizontalPadding * 2, marginRight: -horizontalPadding * 2, width: windowDimensions.width }]}>
          <Image 
            source={{ uri: book.ad_image || book.cover || DEFAULT_COVER }}
            style={[styles.coverImage, { width: windowDimensions.width, maxWidth: windowDimensions.width }, imageAspectRatio ? { aspectRatio: imageAspectRatio } : null]}
            resizeMode="contain"
            onError={(error) => {
              console.error("Image load error:", error.nativeEvent.error)
            }}
            onLoad={(event) => {
              try {
                const source = event.nativeEvent?.source
                if (source && source.width && source.height) {
                  const aspectRatio = source.width / source.height
                  setImageAspectRatio(aspectRatio)
                  console.log("Image loaded:", { width: source.width, height: source.height, aspectRatio, screenWidth: windowDimensions.width })
                } else if (isWeb && event.nativeEvent?.target) {
                  // Web fallback: get dimensions from the loaded image element
                  const img = event.nativeEvent.target as HTMLImageElement
                  if (img && img.naturalWidth && img.naturalHeight) {
                    const aspectRatio = img.naturalWidth / img.naturalHeight
                    setImageAspectRatio(aspectRatio)
                    console.log("Image loaded (web):", { width: img.naturalWidth, height: img.naturalHeight, aspectRatio, screenWidth: windowDimensions.width })
                  }
                }
              } catch (error) {
                console.error("Error getting image dimensions:", error)
              }
            }}
          />
        </View>

        {/* Book title */}
        <View style={[styles.titleContainer, { paddingHorizontal: horizontalPadding, marginTop: 20 }]}>
          <Text style={styles.bookTitle}>{book.book_name}</Text>
        </View>

        {/* Summary and chapters content */}
        <View style={[styles.contentContainer, { paddingHorizontal: horizontalPadding }]}>
          {book.summary && (
            <Text style={styles.summaryText}>{book.summary}</Text>
          )}
          
          {chapters.map((chapter, index) => (
            <View key={chapter.id} style={styles.chapterSection}>
              {index > 0 || book.summary ? (
                <View style={styles.divider} />
              ) : null}
              <Text style={styles.chapterTitle}>
                Chapter {chapter.chapter_number}{chapter.chapter_title ? `: ${chapter.chapter_title}` : ""}
              </Text>
              <Text style={styles.chapterContent}>{chapter.chapter_content}</Text>
            </View>
          ))}
        </View>

        {/* Promotional text at bottom */}
        <Pressable 
          style={[styles.promotionalLink, { paddingHorizontal: horizontalPadding }]}
          onPress={handlePromotionalClick}
        >
          <Text style={styles.promotionalText}>
            🔥🔥🔥Click here to read more exciting content👉
          </Text>
        </Pressable>

        {/* Spacer for button */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Floating CONTINUE READING button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable 
          style={styles.continueButton}
          onPress={handleContinueReading}
        >
          <Text style={styles.continueButtonText}>👉 CONTINUE READING 👈</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  coverImage: {
    alignSelf: "center",
    aspectRatio: 16 / 9, // Default, will be overridden by actual image aspect ratio
  },
  titleContainer: {
    marginBottom: 20,
  },
  bookTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    fontFamily: Platform.select({
      web: "Georgia, serif",
      default: "serif",
    }),
  },
  contentContainer: {
    marginBottom: 30,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000",
    marginBottom: 20,
  },
  chapterSection: {
    marginBottom: 20,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  chapterContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#000",
  },
  promotionalLink: {
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "nowrap",
  },
  promotionalText: {
    fontSize: 16,
    color: "#ff6b35", // Orange color
    textAlign: "center",
    fontWeight: "500",
    whiteSpace: "nowrap",
    ...Platform.select({
      web: {
        borderBottomWidth: 1,
        borderBottomColor: "#ff6b35",
        borderBottomStyle: "solid",
        whiteSpace: "nowrap",
      },
      default: {
        borderBottomWidth: 1,
        borderBottomColor: "#ff6b35",
      },
    }),
  },
  buttonSpacer: {
    height: 20,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 44, // Moved 20% higher (from 20 to 44) - exactly like Download the Book button
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: 280,
    alignItems: "center",
    backgroundColor: "#ff6b35", // Fallback for native
    ...Platform.select({
      web: {
        backgroundImage: "linear-gradient(to right, #ff4444, #ff6b35)",
        boxShadow: "0 4px 4px rgba(0, 0, 0, 0.3)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
      },
    }),
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
  },
})
