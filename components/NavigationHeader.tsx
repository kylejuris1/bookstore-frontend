import React from "react"
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useSegments } from "expo-router"
import { useTheme } from "../context/ThemeContext"
import { useLibrary } from "../context/LibraryContext"

const APP_DOWNLOAD_URL = "https://apps.apple.com/app/id6756338644"

export default function NavigationHeader() {
  const router = useRouter()
  const segments = useSegments()
  const { theme } = useTheme()
  const { credits } = useLibrary()
  const windowDimensions = useWindowDimensions()
  const isWeb = Platform.OS === "web"
  
  const currentRoute = segments[segments.length - 1] || "index"
  const isReaderScreen = segments.includes("reader")
  
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

  return (
    <View style={[styles.header, { paddingHorizontal: horizontalPadding, backgroundColor: theme.background }]}>
      {!isReaderScreen && (
        <Pressable onPress={() => router.push("/(tabs)")} style={styles.titleContainer}>
          <Ionicons name="book" size={24} color={theme.primary} />
          <Text style={[styles.titleBase]}>
            <Text style={[styles.titleNext, { color: theme.text }]}>Next</Text>
            <Text style={[styles.titlePage, { color: theme.text }]}>Page</Text>
          </Text>
        </Pressable>
      )}
      {isReaderScreen && windowDimensions.width >= 768 && (
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
        </View>
      )}
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
          {windowDimensions.width >= 900 && (
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
          {windowDimensions.width >= 900 && (
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
          {windowDimensions.width >= 900 && (
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
          {windowDimensions.width >= 900 && (
            <Text style={[
              styles.navButtonText,
              { color: currentRoute === "profile" ? theme.primary : theme.textSecondary }
            ]}>Profile</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.headerRight}>
        {!isReaderScreen && windowDimensions.width >= 768 && (
          <View style={[
            styles.searchContainer, 
            { backgroundColor: currentRoute === "index" ? theme.card : "transparent" },
            currentRoute !== "index" && styles.searchContainerPlaceholder
          ]}>
            {currentRoute === "index" && (
              <Ionicons name="search" size={18} color={theme.textSecondary} />
            )}
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
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    flexWrap: "nowrap",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    minHeight: 48,
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
  },
  searchContainerPlaceholder: {
    borderWidth: 0,
    pointerEvents: "none",
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

