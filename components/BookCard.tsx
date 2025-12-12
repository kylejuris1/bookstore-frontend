import React from "react"
import { View, Image, Text, StyleSheet, Pressable, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLibrary } from "../context/LibraryContext"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useRouter } from "expo-router"

type CardBook = {
  id: string
  title: string
  author: string
  cover?: string | null
  summary?: string | null
  tags?: string[]
  views?: number
}

type BookCardProps = {
  book: CardBook
  onPress: () => void
  rank?: number
}

const DEFAULT_COVER = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450"

const formatViews = (views?: number) => {
  const v = typeof views === "number" ? views : 0
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return `${v}`
}

export default function BookCard({ book, onPress, rank }: BookCardProps) {
  const { isBookmarked, toggleBookmark } = useLibrary()
  const { theme } = useTheme()
  const { user } = useAuth()
  const router = useRouter()
  const [imageError, setImageError] = React.useState(false)
  const isBookmarkedValue = isBookmarked(book.id)

  const handleToggleBookmark = async () => {
    await toggleBookmark(book.id)
  }

  const coverUri = !imageError ? (book.cover || DEFAULT_COVER) : undefined

  return (
    <Pressable style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.coverWrapper}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.cover}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.cover, styles.coverFallback, { backgroundColor: theme.muted }]}>
              <Ionicons name="book" size={32} color={theme.textSecondary} />
            </View>
          )}
          <Pressable style={styles.readPill} onPress={onPress}>
            <Ionicons name="play" size={14} color="#fff" />
            <Text style={styles.readText}>Read</Text>
          </Pressable>
          {typeof rank === "number" && (
            <View style={[styles.rankBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.rankText}>#{rank}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
            {book.author}
          </Text>

          {book.summary ? (
            <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={3}>
              {book.summary}
            </Text>
          ) : null}

          {book.tags?.length ? (
            <View style={styles.tagsContainer}>
              {book.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.muted }]}>
                  <Text style={[styles.tagText, { color: theme.text }]}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.footer}>
            <View style={styles.infoContainer}>
              <Ionicons name="eye" size={14} color={theme.textSecondary} />
              <Text style={[styles.info, { color: theme.textSecondary }]}>{formatViews(book.views)}</Text>
            </View>
            <Pressable
              style={[
                styles.bookmarkButton,
                { borderColor: theme.primary },
                isBookmarkedValue && { backgroundColor: theme.primary },
              ]}
              onPress={handleToggleBookmark}
            >
              <Ionicons
                name={isBookmarkedValue ? "bookmark" : "bookmark-outline"}
                size={16}
                color={isBookmarkedValue ? "#fff" : theme.primary}
              />
              <Text
                style={[
                  styles.bookmarkText,
                  { color: isBookmarkedValue ? "#fff" : theme.primary },
                ]}
              >
                {isBookmarkedValue ? "Bookmarked" : "Bookmark"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  coverWrapper: {
    position: "relative",
    width: 110,
    height: 155,
    borderRadius: 10,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  coverFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  readPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  readText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rankText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  body: {
    flex: 1,
    gap: 6,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  author: {
    fontSize: 13,
    fontWeight: "500",
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  info: {
    fontSize: 12,
  },
  bookmarkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  bookmarkText: {
    fontSize: 12,
    fontWeight: "600",
  },
})

