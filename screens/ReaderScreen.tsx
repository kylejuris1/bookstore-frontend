import { useState, useEffect, useMemo } from "react"
import React from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Modal, Alert, ActivityIndicator, Linking, Platform, useWindowDimensions, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"
import { fetchChapters, fetchChapter, fetchBook, logBookView, type Chapter, type Book } from "../lib/api"
import NavigationHeader from "../components/NavigationHeader"
import PromotionalBanner from "../components/PromotionalBanner"

const CHAPTER_COST = 50
const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6756338644"

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function ReaderScreen() {
  const router = useRouter()
  const { book: bookParam, bookId: bookIdParam, chapter: chapterParam } = useLocalSearchParams()
  
  // Support both old format (book object) and new format (bookId)
  const bookIdFromParam = bookIdParam as string | undefined
  const parsedBook = useMemo(() => {
    if (bookParam) {
      try {
        return JSON.parse(bookParam as string)
      } catch (e) {
        return null
      }
    }
    return null
  }, [bookParam])
  
  // Use bookId from param if available, otherwise fall back to parsed book
  const bookIdFromUrl = bookIdFromParam || parsedBook?.id
  
  const { credits, unlockChapter, isChapterUnlocked, getLastReadChapter, updateReadingProgress, settings } = useLibrary()
  const { theme } = useTheme()
  const [book, setBook] = useState<Book | null>(parsedBook)
  const [isLoadingBook, setIsLoadingBook] = useState(!parsedBook && !!bookIdFromUrl)
  const bookId = bookIdFromUrl
  const isWeb = Platform.OS === "web"
  const windowDimensions = useWindowDimensions()
  
  const horizontalPadding = useMemo(() => {
    const width = windowDimensions.width
    // Smooth interpolation for reader screen
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
  
  const [currentChapter, setCurrentChapter] = useState(() => {
    if (chapterParam) return Number(chapterParam)
    if (bookId) return getLastReadChapter(bookId)
    return 1
  })
  const [showPaywall, setShowPaywall] = useState(false)
  const [pendingChapter, setPendingChapter] = useState<number | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [totalChapters, setTotalChapters] = useState(30)
  const [isLoadingChapter, setIsLoadingChapter] = useState(true)
  const isWebBlocked = isWeb && currentChapter >= 6

  // Load book data if we only have bookId (new format)
  useEffect(() => {
    if (!bookIdFromUrl || parsedBook) return // Skip if we already have book data or no bookId
    
    let cancelled = false
    
    const loadBook = async () => {
      setIsLoadingBook(true)
      try {
        const bookData = await fetchBook(bookIdFromUrl)
        if (!cancelled && bookData) {
          setBook(bookData)
        }
      } catch (error) {
        console.error("Error loading book:", error)
      } finally {
        if (!cancelled) {
          setIsLoadingBook(false)
        }
      }
    }
    
    loadBook()
    
    return () => {
      cancelled = true
    }
  }, [bookIdFromUrl, parsedBook])

  // Load chapter data from Supabase - only depend on bookId and currentChapter
  useEffect(() => {
    if (!bookId) return

    let cancelled = false

    const loadChapter = async () => {
      setIsLoadingChapter(true)
      try {
        // First, get total chapters count (only once per book)
        const allChapters = await fetchChapters(bookId)
        if (!cancelled) {
          setTotalChapters(allChapters.length)

          if (isWebBlocked) {
            setChapter(null)
            return
          }

          // Then load the current chapter
          const chapterData = await fetchChapter(bookId, currentChapter)
          if (!cancelled) {
            setChapter(chapterData)
          }
        }
      } catch (error) {
        console.error("Error loading chapter:", error)
        if (!cancelled) {
          setIsLoadingChapter(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingChapter(false)
        }
      }
    }

    loadChapter()

    return () => {
      cancelled = true
    }
  }, [bookId, currentChapter, isWebBlocked])

  // Log a view when the reader opens for a book
  useEffect(() => {
    if (!bookId) return
    logBookView(bookId)
  }, [bookId])

  // Update reading progress when chapter changes - use bookId instead of book
  useEffect(() => {
    if (bookId && currentChapter) {
      updateReadingProgress(bookId, currentChapter)
    }
  }, [currentChapter, bookId, updateReadingProgress])

  if (isLoadingBook) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <PromotionalBanner />
        <NavigationHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!book || !bookId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/(tabs)")}>
            <Ionicons name="chevron-back" size={28} color="#d4876f" />
          </Pressable>
          <Text style={styles.headerTitle}>Book not found</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
    )
  }

  const isLocked = !isWebBlocked && bookId ? currentChapter >= 6 && !isChapterUnlocked(bookId, currentChapter) : false
  const canGoNext = currentChapter < totalChapters
  const canGoPrev = currentChapter > 1

  const handleNextChapter = async () => {
    if (isWeb) {
      const nextChapter = Math.min(currentChapter + 1, totalChapters)
      setCurrentChapter(nextChapter)
      return
    }

    if (!bookId) return
    const nextChapter = currentChapter + 1

    // Check if next chapter is locked (6+)
    if (nextChapter >= 6 && !isChapterUnlocked(bookId, nextChapter)) {
      setPendingChapter(nextChapter)
      setShowPaywall(true)
      return
    }

    setCurrentChapter(nextChapter)
  }

  const handlePreviousChapter = () => {
    if (canGoPrev) {
      setCurrentChapter(currentChapter - 1)
    }
  }

  const handleContinueOnApp = () => {
    Linking.openURL(APP_DOWNLOAD_URL).catch(() => {
      Alert.alert("Open the app", "Please download or open the mobile app to continue reading.")
    })
  }

  const handleUnlockChapter = async () => {
    if (!pendingChapter || !bookId) return

    const success = await unlockChapter(bookId, pendingChapter)
    if (success) {
      setCurrentChapter(pendingChapter)
      setShowPaywall(false)
      setPendingChapter(null)
    } else {
      Alert.alert("Insufficient Credits", `You need ${CHAPTER_COST} credits to unlock this chapter. You currently have ${credits} credits.`)
    }
  }

  const renderContent = () => {
    if (isLoadingChapter) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )
    }

    if (isWebBlocked) {
      return (
        <View style={styles.lockedContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color={theme.primary} />
          <Text style={[styles.lockedTitle, { color: theme.text }]}>Continue on the App</Text>
          <Text style={[styles.lockedText, { color: theme.textSecondary }]}>
            Chapters 6 and above are available in the mobile app. Open the app to keep reading.
          </Text>
          <Pressable 
            style={[styles.unlockButton, { backgroundColor: theme.primary }]} 
            onPress={handleContinueOnApp}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.unlockButtonText}>Continue Reading for FREE</Text>
          </Pressable>
        </View>
      )
    }

    if (!chapter) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Chapter not found</Text>
        </View>
      )
    }

    if (isLocked) {
      return (
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color={theme.primary} />
          <Text style={[styles.lockedTitle, { color: theme.text }]}>Chapter {currentChapter} is Locked</Text>
          <Text style={[styles.lockedText, { color: theme.textSecondary }]}>
            Unlock this chapter for {CHAPTER_COST} credits to continue reading.
          </Text>
          <Pressable 
            style={[styles.unlockButton, { backgroundColor: theme.primary }]} 
            onPress={() => handleUnlockChapter()}
          >
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={styles.unlockButtonText}>Unlock for {CHAPTER_COST} Credits</Text>
          </Pressable>
          <Text style={[styles.creditsText, { color: theme.textSecondary }]}>You have {credits} credits</Text>
        </View>
      )
    }

    return (
      <View style={styles.chapterContentWrapper}>
        <Text style={[styles.chapterTitle, { color: theme.primary }]}>{chapter.chapter_title || `Chapter ${currentChapter}`}</Text>
        <View style={styles.chapterTextContainer}>
          <Text style={[
            styles.chapterContent, 
            { 
              fontSize: settings.fontSize || 16, 
              lineHeight: (settings.fontSize || 16) * 1.625,
              color: theme.text
            }
          ]}>
            {chapter.chapter_content}
          </Text>
          {/* Fade gradient overlay */}
          {Platform.OS === "web" ? (
            <View 
              style={[
                styles.textFadeOverlay,
                {
                  // @ts-ignore - web-specific style
                  backgroundImage: `linear-gradient(to bottom, ${hexToRgba(theme.background, 0)} 0%, ${hexToRgba(theme.background, 0.2)} 30%, ${hexToRgba(theme.background, 0.5)} 70%, ${hexToRgba(theme.background, 0.6)} 100%)`,
                }
              ]} 
              pointerEvents="none" 
            />
          ) : (
            <View 
              style={[
                styles.textFadeOverlay,
                {
                  backgroundColor: theme.background,
                  opacity: 0.6, // 60% opacity overlay = 40% visible text
                }
              ]} 
              pointerEvents="none" 
            />
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <PromotionalBanner />
      <NavigationHeader />
      <ScrollView style={[styles.content, { paddingHorizontal: horizontalPadding }]} showsVerticalScrollIndicator={false}>
        {/* Header with book title and back button - scrolls with content */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingHorizontal: horizontalPadding, marginHorizontal: -horizontalPadding }]}>
          <Pressable onPress={() => {
            if (bookId) {
              router.push({ pathname: "/book/[bookId]", params: { bookId } })
            } else {
              router.push("/(tabs)")
            }
          }}>
            <Ionicons name="chevron-back" size={20} color={theme.primary} />
          </Pressable>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              if (bookId) {
                router.push({ pathname: "/book/[bookId]", params: { bookId } })
              }
            }}
          >
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {book.book_name || (book as any).title}
            </Text>
          </Pressable>
          <View style={{ width: 28 }} />
        </View>
        {renderContent()}
        {!isLoadingChapter && !isWebBlocked && chapter && !isLocked && (
          <View style={styles.continueSection}>
              <Image source={require("../assets/icon.png")} style={styles.nextPageLogo} />
              <Text style={[styles.continueQuestion, { color: theme.text }]}>Want to know what happens next?</Text>
              <Pressable 
                style={styles.continueButton}
                onPress={handleContinueOnApp}
              >
                <Text style={styles.continueButtonText}>Continue Reading</Text>
              </Pressable>
            </View>
        )}
        
        {/* Chapter Navigation Buttons */}
        {!isLoadingChapter && !isWebBlocked && chapter && !isLocked && (
          <View style={[styles.chapterNavigation, { paddingHorizontal: horizontalPadding }]}>
            <Pressable
              style={[
                styles.navButton, 
                { backgroundColor: theme.card },
                !canGoPrev && styles.navButtonDisabled
              ]}
              onPress={handlePreviousChapter}
              disabled={!canGoPrev}
            >
              <Ionicons name="chevron-back" size={20} color={!canGoPrev ? theme.textSecondary : theme.primary} />
              <Text style={[
                styles.navButtonText, 
                { color: !canGoPrev ? theme.textSecondary : theme.primary }
              ]}>Previous Chapter</Text>
            </Pressable>

            <Pressable
              style={[
                styles.navButton, 
                { backgroundColor: theme.card },
                !canGoNext && styles.navButtonDisabled
              ]}
              onPress={handleNextChapter}
              disabled={!canGoNext}
            >
              <Text style={[
                styles.navButtonText, 
                { color: !canGoNext ? theme.textSecondary : "#FFB6C1" } // Lighter pink (#FFB6C1) compared to Continue Reading button (#FF69B4)
              ]}>Next Chapter</Text>
              <Ionicons name="chevron-forward" size={20} color={!canGoNext ? theme.textSecondary : "#FFB6C1"} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Floating Download the Book button */}
      <View style={styles.floatingDownloadButtonContainer}>
        <Pressable 
          style={styles.floatingDownloadButton}
          onPress={handleContinueOnApp}
        >
          <Text style={styles.floatingDownloadButtonText}>Download the Book</Text>
        </Pressable>
      </View>

      <Modal visible={showPaywall} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Ionicons name="lock-closed" size={48} color={theme.primary} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Unlock Chapter {pendingChapter}?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This chapter requires {CHAPTER_COST} credits to unlock. You currently have {credits} credits.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.muted }]} 
                onPress={() => setShowPaywall(false)}
              >
                <Text style={[styles.modalButtonTextCancel, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm, 
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => {
                  if (credits < CHAPTER_COST) {
                    setShowPaywall(false)
                    // Web doesn't support payments - just close the paywall
                  } else {
                    handleUnlockChapter()
                  }
                }}
              >
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.modalButtonTextConfirm}>
                  {credits < CHAPTER_COST ? "Purchase credits" : `Unlock\n(${CHAPTER_COST} credits)`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginTop: 0, // Reduced from 8 to eliminate gap
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingVertical: 12, // Reduced from 24 to bring content closer to header
  },
  chapterContentWrapper: {
    position: "relative",
  },
  chapterTextContainer: {
    position: "relative",
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8, // Added small top margin
    marginBottom: 12, // Reduced from 16 to bring title closer to content
  },
  chapterContent: {
    fontSize: 16, // Default, will be overridden
    lineHeight: 26,
    fontFamily: "System",
    paddingBottom: 0, // Removed padding - fade overlay handles the visual fade
  },
  textFadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300, // Increased by 50% from 200 to 300 for more prominent fade
    zIndex: 1, // Ensure overlay is above text
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  lockedText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  unlockButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  creditsText: {
    fontSize: 14,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
  },
  chapterNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    gap: 16, // Increased from 12 to add more space between buttons
    marginTop: 20,
    paddingBottom: 120, // Doubled from 60 to 120 for more scrolling space
    position: "relative",
    zIndex: 10, // Ensure buttons are above the fade overlay (which has zIndex: 1)
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 0, // Allow button to shrink
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1, // Allow text to shrink if needed
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonCancel: {},
  modalButtonConfirm: {},
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
    lineHeight: 16,
    flexWrap: "wrap",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingDownloadButtonContainer: {
    position: "absolute",
    bottom: 44, // Moved 20% higher (from 20 to 44)
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "box-none",
  },
  floatingDownloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#ffc566",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    minWidth: 200,
    alignItems: "center",
  },
  floatingDownloadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  continueSection: {
    position: "relative",
    zIndex: 10, // Ensure continue section is above the fade overlay (which has zIndex: 1)
    alignItems: "center",
    paddingTop: 0, // Removed padding entirely between text and continue section
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  nextPageLogo: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginBottom: 12,
  },
  continueQuestion: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#FF69B4",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
