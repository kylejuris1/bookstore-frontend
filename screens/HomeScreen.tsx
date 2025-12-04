import { useState, useEffect } from "react"
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
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useLibrary } from "../context/LibraryContext"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import BookCard from "../components/BookCard"
import { fetchBooks, type Book } from "../lib/api"
import TopUpModal from "../components/TopUpModal"

export const MOCK_BOOKS = [
  {
    id: "1",
    title: "Whispers of Destiny",
    author: "Elena Monroe",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450",
    description: "A tale of forbidden love across time.",
    tags: ["Romance", "Fantasy"],
    credits: 50,
    views: 2.4,
  },
  {
    id: "2",
    title: "Hearts Entwined",
    author: "Sofia Rivera",
    cover: "https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=300&h=450",
    description: "Two souls destined to meet.",
    tags: ["Romance", "Contemporary"],
    credits: 40,
    views: 1.8,
  },
  {
    id: "3",
    title: "Moonlit Secrets",
    author: "Isabella Chen",
    cover: "https://images.unsplash.com/photo-1516979187457-635ffe35ff15?w=300&h=450",
    description: "Mysteries lurk in the shadows.",
    tags: ["Mystery", "Romance"],
    credits: 60,
    views: 3.1,
  },
  {
    id: "4",
    title: "Eternal Flames",
    author: "Amelia Stone",
    cover: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&h=450",
    description: "A love that burns forever.",
    tags: ["Fantasy", "Romance"],
    credits: 55,
    views: 2.9,
  },
  {
    id: "5",
    title: "Broken Hearts Mend",
    author: "Sophie Laurent",
    cover: "https://images.unsplash.com/photo-1491841573634-28fb1daf603b?w=300&h=450",
    description: "Healing through unexpected love.",
    tags: ["Contemporary", "Romance"],
    credits: 45,
    views: 2.1,
  },
  {
    id: "6",
    title: "Shadow of Tomorrow",
    author: "Emma Cross",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450",
    description: "A mystery wrapped in passion.",
    tags: ["Mystery", "Thriller"],
    credits: 65,
    views: 3.5,
  },
]

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const { credits, isLoading: libraryLoading } = useLibrary()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [showTopUpModal, setShowTopUpModal] = useState(false)

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoadingBooks(true)
        const fetchedBooks = await fetchBooks()
        setBooks(fetchedBooks)
      } catch (error) {
        console.error("Error loading books:", error)
        // Fallback to mock books if Supabase fails
        setBooks(MOCK_BOOKS.map(b => ({
          id: b.id,
          book_id: b.id,
          book_name: b.title,
          author: b.author,
          date_uploaded: new Date().toISOString(),
          tags: b.tags,
        })))
      } finally {
        setIsLoadingBooks(false)
      }
    }

    loadBooks()
  }, [])

  const tags = ["All", "Romance", "Fantasy", "Contemporary", "Mystery", "Thriller"]

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.book_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || selectedTag === "All" || book.tags.includes(selectedTag)
    return matchesSearch && matchesTag
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Bookstore</Text>
        <View style={styles.headerRight}>
          <Pressable 
            style={[styles.topUpButton, { backgroundColor: theme.primary }]} 
            onPress={() => {
              if (user) {
                setShowTopUpModal(true)
              } else {
                // Could navigate to settings/login or show alert
                Alert.alert("Sign In Required", "Please sign in to purchase credits")
              }
            }}
          >
            <Text style={styles.topUpButtonText}>TOP UP</Text>
          </Pressable>
          <View style={[styles.creditsContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="star" size={20} color={theme.primary} />
            <Text style={[styles.credits, { color: theme.primary }]}>{credits}</Text>
          </View>
        </View>
      </View>

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

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Now</Text>
        <FlatList
          data={filteredBooks}
          renderItem={({ item }) => {
            // Convert Supabase book format to BookCard format
            const bookCardData = {
              id: item.book_id,
              title: item.book_name,
              author: item.author,
              cover: MOCK_BOOKS.find(b => b.id === item.book_id)?.cover || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450",
              description: MOCK_BOOKS.find(b => b.id === item.book_id)?.description || "",
              tags: item.tags,
              credits: MOCK_BOOKS.find(b => b.id === item.book_id)?.credits || 50,
              views: MOCK_BOOKS.find(b => b.id === item.book_id)?.views || 0,
            }
            return (
              <BookCard 
                book={bookCardData} 
                onReadPress={() => router.push({ pathname: "/reader", params: { book: JSON.stringify(bookCardData) } })} 
              />
            )
          }}
          keyExtractor={(item) => item.book_id}
          scrollEnabled={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      </ScrollView>

      <TopUpModal visible={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
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
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
})
