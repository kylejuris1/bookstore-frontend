import React from "react"
import { View, Image, Text, StyleSheet, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"

export default function BookCard({ book, onReadPress }) {
  const { isBookmarked, toggleBookmark } = useLibrary()
  const { theme } = useTheme()
  const [imageError, setImageError] = React.useState(false)
  const [showOverlay, setShowOverlay] = React.useState(false)
  const isBookmarkedValue = isBookmarked(book.id)

  const handleToggleBookmark = async () => {
    await toggleBookmark(book.id)
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.coverContainer} onPress={onReadPress}>
        {!imageError ? (
          <Image
            source={{ uri: book.cover }}
            style={styles.cover}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: theme.muted }]}>
            <Ionicons name="book" size={40} color={theme.textSecondary} />
          </View>
        )}
        <Pressable
          style={[styles.overlay, showOverlay && styles.overlayVisible]}
          onPress={onReadPress}
          onPressIn={() => setShowOverlay(true)}
          onPressOut={() => setShowOverlay(false)}
        >
          <View style={styles.readButton}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.readButtonText}>Read Now</Text>
          </View>
        </Pressable>
      </Pressable>

      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={[styles.author, { color: theme.textSecondary }]}>{book.author}</Text>

      <View style={styles.footer}>
        <View style={styles.infoContainer}>
          <Ionicons name="eye" size={14} color={theme.textSecondary} />
          <Text style={[styles.info, { color: theme.textSecondary }]}>{book.views}M</Text>
        </View>
        <Pressable
          style={[
            styles.addButton, 
            { borderColor: theme.primary },
            isBookmarkedValue && { backgroundColor: theme.primary }
          ]}
          onPress={handleToggleBookmark}
        >
          <Ionicons
            name={isBookmarkedValue ? "bookmark" : "bookmark-outline"}
            size={16}
            color={isBookmarkedValue ? "#fff" : theme.primary}
          />
          <Text style={[
            styles.addButtonText, 
            { color: theme.primary },
            isBookmarkedValue && styles.addButtonTextActive
          ]}>
            {isBookmarkedValue ? "Bookmarked" : "Bookmark"}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '48%', // Fixed width to ensure consistent sizing
    marginBottom: 16,
    alignSelf: 'flex-start', // Prevent stretching
  },
  coverContainer: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    aspectRatio: 0.67,
    width: '100%',
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    opacity: 0,
  },
  overlayVisible: {
    opacity: 1,
  },
  readButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4876f",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  readButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  info: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  addButtonTextActive: {
    color: "#fff",
  },
})
