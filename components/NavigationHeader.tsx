import React, { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform, Linking, Modal, Animated, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useSegments } from "expo-router"
import { useTheme } from "../context/ThemeContext"
import { useLibrary } from "../context/LibraryContext"
import { fetchBooks, type Book } from "../lib/api"

const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6756338644"

export default function NavigationHeader() {
  const router = useRouter()
  const segments = useSegments()
  const { theme } = useTheme()
  const { credits } = useLibrary()
  const windowDimensions = useWindowDimensions()
  const isWeb = Platform.OS === "web"
  const [showSidePanel, setShowSidePanel] = useState(false)
  
  const currentRoute = segments[segments.length - 1] || "index"
  const isReaderScreen = segments.includes("reader")
  const [allTags, setAllTags] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(true)
  
  // Show hamburger menu when window is too small to fit all nav items
  const showHamburgerMenu = windowDimensions.width < 900
  
  // Side panel slide animation
  const slideAnim = React.useRef(new Animated.Value(-280)).current
  
  // Fetch all unique tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        setIsLoadingTags(true)
        const books = await fetchBooks()
        const tagSet = new Set<string>()
        books.forEach((book) => {
          (book.tags || []).forEach((tag) => tagSet.add(tag))
        })
        setAllTags(Array.from(tagSet).sort())
      } catch (error) {
        console.error("Error loading tags:", error)
        setAllTags([])
      } finally {
        setIsLoadingTags(false)
      }
    }
    loadTags()
  }, [])
  
  // Animate side panel
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSidePanel ? 0 : -280,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [showSidePanel, slideAnim])
  
  // Calculate responsive padding with smooth transitions
  const horizontalPadding = React.useMemo(() => {
    const width = windowDimensions.width
    // Smooth interpolation: gradually reduce padding as window gets smaller
    if (width < 640) {
      return 16
    } else if (width < 1024) {
      const minPadding = 16
      const maxPadding = width * 0.1
      const ratio = (width - 640) / (1024 - 640)
      return minPadding + (maxPadding - minPadding) * ratio
    } else if (width < 1920) {
      const minPadding = width * 0.1
      const maxPadding = Math.min(width * 0.2, 384)
      const ratio = (width - 1024) / (1920 - 1024)
      return minPadding + (maxPadding - minPadding) * ratio
    } else {
      return Math.min(width * 0.2, 384)
    }
  }, [windowDimensions.width])

  const renderNavButtons = (inSidePanel = false) => (
    <>
      <Pressable
        style={[styles.navButton, inSidePanel && styles.sidePanelNavButton]}
        onPress={() => {
          router.push("/(tabs)")
          if (inSidePanel) setShowSidePanel(false)
        }}
      >
        <Ionicons 
          name="compass" 
          size={20} 
          color={currentRoute === "index" ? theme.primary : theme.textSecondary} 
        />
        <Text style={[
          styles.navButtonText,
          { color: currentRoute === "index" ? theme.primary : theme.textSecondary }
        ]}>Discover</Text>
      </Pressable>
      <Pressable
        style={[styles.navButton, inSidePanel && styles.sidePanelNavButton]}
        onPress={() => {
          router.push("/(tabs)/library")
          if (inSidePanel) setShowSidePanel(false)
        }}
      >
        <Ionicons 
          name="book" 
          size={20} 
          color={currentRoute === "library" ? theme.primary : theme.textSecondary} 
        />
        <Text style={[
          styles.navButtonText,
          { color: currentRoute === "library" ? theme.primary : theme.textSecondary }
        ]}>Library</Text>
      </Pressable>
      <Pressable
        style={[styles.navButton, inSidePanel && styles.sidePanelNavButton]}
        onPress={() => {
          router.push("/(tabs)/rank")
          if (inSidePanel) setShowSidePanel(false)
        }}
      >
        <Ionicons 
          name="trophy" 
          size={20} 
          color={currentRoute === "rank" ? theme.primary : theme.textSecondary} 
        />
        <Text style={[
          styles.navButtonText,
          { color: currentRoute === "rank" ? theme.primary : theme.textSecondary }
        ]}>Rank</Text>
      </Pressable>
      <Pressable
        style={[styles.navButton, inSidePanel && styles.sidePanelNavButton]}
        onPress={() => {
          router.push("/(tabs)/profile")
          if (inSidePanel) setShowSidePanel(false)
        }}
      >
        <Ionicons 
          name="person-circle" 
          size={20} 
          color={currentRoute === "profile" ? theme.primary : theme.textSecondary} 
        />
        <Text style={[
          styles.navButtonText,
          { color: currentRoute === "profile" ? theme.primary : theme.textSecondary }
        ]}>Profile</Text>
      </Pressable>
    </>
  )

  return (
    <>
      <View style={[styles.header, { paddingHorizontal: horizontalPadding, backgroundColor: theme.background }]}>
        {/* Hamburger menu button - always on the left */}
        <Pressable 
          style={styles.hamburgerButton}
          onPress={() => setShowSidePanel(true)}
        >
          <Ionicons name="menu" size={24} color={theme.text} />
        </Pressable>
        
        {/* Navigation buttons - show in header if space available, otherwise in side panel */}
        {!showHamburgerMenu && (
          <View style={styles.headerNav}>
            {renderNavButtons(false)}
          </View>
        )}
        
        <View style={styles.headerRight}>
          {/* Search bar - always visible on the right */}
          <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
          </View>
          
          {windowDimensions.width >= 1024 && (
            <Pressable 
              style={[styles.topUpButton, { backgroundColor: theme.primary }]} 
              onPress={() => {
                if (isWeb) {
                  Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
                  return
                }
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
      
      {/* Side Panel - slides from left */}
      {showSidePanel && (
        <Pressable 
          style={styles.sidePanelOverlay}
          onPress={() => setShowSidePanel(false)}
        >
          <Animated.View 
            style={[
              styles.sidePanel, 
              { 
                backgroundColor: theme.background,
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={styles.sidePanelHeader}>
              <Pressable 
                onPress={() => {
                  router.push("/(tabs)")
                  setShowSidePanel(false)
                }} 
                style={styles.sidePanelTitle}
              >
                <Ionicons name="book" size={24} color={theme.primary} />
                <Text style={[styles.titleBase]}>
                  <Text style={[styles.titleNext, { color: theme.text }]}>Next</Text>
                  <Text style={[styles.titlePage, { color: theme.text }]}>Page</Text>
                </Text>
              </Pressable>
              <Pressable onPress={() => setShowSidePanel(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.sidePanelNav}>
                {renderNavButtons(true)}
              </View>
              
              {/* Browse/Tags Section */}
              <View style={styles.sidePanelContent}>
                <Text style={[styles.browseHeading, { color: theme.text }]}>Browse</Text>
                <View style={styles.tagsGrid}>
                  {isLoadingTags ? (
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading tags...</Text>
                  ) : (
                    allTags.map((tag) => (
                      <Pressable
                        key={tag}
                        style={[styles.tagButton, { backgroundColor: theme.card }]}
                        onPress={() => {
                          router.push(`/tag/${tag}`)
                          setShowSidePanel(false)
                        }}
                      >
                        <Text style={[styles.tagButtonText, { color: theme.text }]}>{tag}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
                
                {/* Additional sections */}
                <Text style={[styles.sidePanelSectionHeading, { color: theme.text }]}>Short Stories</Text>
                <Text style={[styles.sidePanelSectionHeading, { color: theme.text }]}>Create</Text>
                <Text style={[styles.sidePanelSectionHeading, { color: theme.text }]}>Writer Benefit</Text>
                <Text style={[styles.sidePanelSectionHeading, { color: theme.text }]}>Contest</Text>
              </View>
            </ScrollView>
            
            {/* Download the Book button - fixed at bottom */}
              <Pressable
                style={[styles.sidePanelDownloadButton, { backgroundColor: "#FFD700" }]}
                onPress={() => {
                  if (isWeb) {
                    Linking.openURL(APP_DOWNLOAD_URL).catch(() => {})
                  }
                  setShowSidePanel(false)
                }}
              >
                <Text style={styles.sidePanelDownloadButtonText}>Download the Book</Text>
              </Pressable>
          </Animated.View>
        </Pressable>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    flexWrap: "nowrap",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    minHeight: 24,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 0,
    flexShrink: 0,
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
  headerNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "nowrap",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 16,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 8,
    zIndex: 0,
    flexShrink: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 150,
    maxWidth: 250,
    flex: 0,
    marginHorizontal: 8,
  },
  hamburgerButton: {
    padding: 8,
    marginLeft: 8,
  },
  sidePanelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  sidePanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  sidePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  sidePanelTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sidePanelNav: {
    gap: 8,
  },
  sidePanelNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidePanelScroll: {
    flex: 1,
  },
  sidePanelContent: {
    marginTop: 24,
  },
  browseHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  sidePanelSectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sidePanelDownloadButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  sidePanelDownloadButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  topUpButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topUpButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  creditsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  credits: {
    fontSize: 16,
    fontWeight: "600",
  },
})

