import { useState, useEffect, useMemo } from "react"
import React from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Modal, Alert, ActivityIndicator, Linking, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"
import { fetchChapters, fetchChapter, logBookView, type Chapter } from "../lib/api"
import TopUpModal from "../components/TopUpModal"

const CHAPTER_COST = 50
const APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.bookstore.harba.app"

export default function ReaderScreen() {
  const router = useRouter()
  const { book: bookParam, chapter: chapterParam } = useLocalSearchParams()
  
  // Memoize the book object to prevent infinite re-renders
  const book = useMemo(() => {
    return bookParam ? JSON.parse(bookParam as string) : null
  }, [bookParam])
  
  const { credits, unlockChapter, isChapterUnlocked, getLastReadChapter, updateReadingProgress, settings } = useLibrary()
  const { theme } = useTheme()
  const bookId = book?.id
  const isWeb = Platform.OS === "web"
  
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
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const isWebBlocked = isWeb && currentChapter >= 2

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

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#d4876f" />
          </Pressable>
          <Text style={styles.headerTitle}>Book not found</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
    )
  }

  const isLocked = !isWebBlocked && bookId ? currentChapter >= 20 && !isChapterUnlocked(bookId, currentChapter) : false
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

    // Check if next chapter is locked (20+)
    if (nextChapter >= 20 && !isChapterUnlocked(bookId, nextChapter)) {
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
            Chapters 2 and above are available in the mobile app. Open the app to keep reading.
          </Text>
          <Pressable 
            style={[styles.unlockButton, { backgroundColor: theme.primary }]} 
            onPress={handleContinueOnApp}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.unlockButtonText}>Continue Reading on the App</Text>
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
      <>
        <Text style={[styles.chapterTitle, { color: theme.primary }]}>{chapter.chapter_title || `Chapter ${currentChapter}`}</Text>
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
      </>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
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
            {book.title}
          </Text>
        </Pressable>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
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
          ]}>Previous</Text>
        </Pressable>

        <Text style={[styles.pageIndicator, { color: theme.textSecondary }]}>
          Chapter {currentChapter} {bookId && currentChapter >= 20 && !isChapterUnlocked(bookId, currentChapter) && "🔒"}
        </Text>

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
            { color: !canGoNext ? theme.textSecondary : theme.primary }
          ]}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={!canGoNext ? theme.textSecondary : theme.primary} />
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
                    setShowTopUpModal(true)
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
      <TopUpModal visible={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  chapterContent: {
    fontSize: 16, // Default, will be overridden
    lineHeight: 26,
    fontFamily: "System",
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pageIndicator: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
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
})
